jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  HelpGuideService,
  WELCOME_TEACHER_TEMPLATE_KEY,
} from './help-guide.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'teacher-1';

interface DuplicateCreateArg {
  data: {
    isSystemTemplate: boolean;
    templateKey?: string;
    authorId: string;
    courseId: string | null;
    slides: { create: { contentVersion: number }[] };
  };
}

function getLastCreateArg(mockFn: jest.Mock): DuplicateCreateArg {
  const calls = mockFn.mock.calls as [DuplicateCreateArg][];
  return calls[calls.length - 1][0];
}

const TEMPLATE_CLASS = {
  id: 'help-guide-class-1',
  title: 'Guía de Lumina',
  description: 'desc',
  background: 'none',
  templateVersion: 42,
  slides: [
    {
      id: 's1',
      order: 1,
      type: 'COVER',
      title: 'Bienvenida',
      content: { bloques: [] },
      contentVersion: 0,
    },
  ],
};

async function createService(options?: {
  classFindUnique?: unknown;
  userFindUnique?: unknown;
}) {
  let classFindUniqueMock: jest.Mock;
  let classCreateMock: jest.Mock;
  let userFindUniqueMock: jest.Mock;
  let userUpdateMock: jest.Mock;

  const module = await Test.createTestingModule({
    providers: [
      HelpGuideService,
      {
        provide: PrismaService,
        useValue: {
          class: {
            findUnique: (classFindUniqueMock = jest
              .fn()
              .mockResolvedValue(
                options && 'classFindUnique' in options
                  ? options.classFindUnique
                  : TEMPLATE_CLASS,
              )),
            findFirst: jest.fn().mockResolvedValue(null),
            create: (classCreateMock = jest.fn().mockResolvedValue({
              id: 'nueva-clase-1',
              title: 'Guía de Lumina (mi copia)',
            })),
          },
          user: {
            findUnique: (userFindUniqueMock = jest
              .fn()
              .mockResolvedValue(
                options && 'userFindUnique' in options
                  ? options.userFindUnique
                  : { welcomeGuideDismissedAt: null },
              )),
            update: (userUpdateMock = jest.fn().mockResolvedValue({})),
          },
        },
      },
    ],
  }).compile();

  return {
    service: module.get<HelpGuideService>(HelpGuideService),
    classFindUniqueMock: classFindUniqueMock,
    classCreateMock: classCreateMock,
    userFindUniqueMock: userFindUniqueMock,
    userUpdateMock: userUpdateMock,
  };
}

describe('HelpGuideService — X.2', () => {
  it('getGuide() busca por templateKey, sin ningún chequeo de propiedad', async () => {
    const { service, classFindUniqueMock } = await createService();
    const result = await service.getGuide(USER_ID);

    expect(classFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { templateKey: WELCOME_TEACHER_TEMPLATE_KEY },
      }),
    );
    expect(result.id).toBe(TEMPLATE_CLASS.id);
    expect(result.dismissedAt).toBeNull();
  });

  it('getGuide() lanza 404 si la plantilla todavía no existe (seed no corrido)', async () => {
    const { service } = await createService({ classFindUnique: null });
    await expect(service.getGuide(USER_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getGuide() refleja welcomeGuideDismissedAt del usuario actual', async () => {
    const dismissedAt = new Date('2026-01-01');
    const { service } = await createService({
      userFindUnique: { welcomeGuideDismissedAt: dismissedAt },
    });
    const result = await service.getGuide(USER_ID);
    expect(result.dismissedAt).toBe(dismissedAt);
  });

  it('duplicateToPersonalSpace() crea una clase normal, NO de sistema, sin templateKey', async () => {
    const { service, classCreateMock } = await createService();
    await service.duplicateToPersonalSpace(USER_ID);

    const createArg = getLastCreateArg(classCreateMock);
    expect(createArg.data.isSystemTemplate).toBe(false);
    expect(createArg.data.templateKey).toBeUndefined();
    expect(createArg.data.authorId).toBe(USER_ID);
    expect(createArg.data.courseId).toBeNull();
    expect(createArg.data.slides.create).toHaveLength(
      TEMPLATE_CLASS.slides.length,
    );
    // contentVersion reseteado — es una copia nueva, no continúa el locking optimista del original.
    expect(createArg.data.slides.create[0].contentVersion).toBe(0);
  });

  it('duplicateToPersonalSpace() lanza 404 si la plantilla todavía no existe', async () => {
    const { service } = await createService({ classFindUnique: null });
    await expect(
      service.duplicateToPersonalSpace(USER_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('dismiss() persiste welcomeGuideDismissedAt del usuario actual', async () => {
    const { service, userUpdateMock } = await createService();
    await service.dismiss(USER_ID);

    const calls = userUpdateMock.mock.calls as [
      { where: { id: string }; data: { welcomeGuideDismissedAt: Date } },
    ][];
    const lastArg = calls[calls.length - 1][0];
    expect(lastArg.where).toEqual({ id: USER_ID });
    expect(lastArg.data.welcomeGuideDismissedAt).toBeInstanceOf(Date);
  });
});
