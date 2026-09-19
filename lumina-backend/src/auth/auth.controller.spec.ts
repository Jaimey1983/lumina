import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60, limit: 10 }],
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register — roles privilegiados', () => {
    const dto = (role: string) =>
      ({
        name: 'a',
        lastName: 'b',
        email: 'a@b.co',
        password: '12345678',
        role,
      }) as never;
    const caller = (role: string) => ({ role }) as never;

    it('rechaza SUPERADMIN/ADMIN sin sesión', () => {
      expect(() => controller.register(dto('SUPERADMIN'), null)).toThrow();
      expect(() => controller.register(dto('ADMIN'), null)).toThrow();
    });

    it('rechaza SUPERADMIN/ADMIN de un docente autenticado', () => {
      expect(() =>
        controller.register(dto('SUPERADMIN'), caller('TEACHER')),
      ).toThrow();
      expect(() =>
        controller.register(dto('ADMIN'), caller('TEACHER')),
      ).toThrow();
    });

    it('ADMIN no puede crear SUPERADMIN', () => {
      expect(() =>
        controller.register(dto('SUPERADMIN'), caller('ADMIN')),
      ).toThrow();
    });

    it('permite TEACHER/STUDENT anónimo y ADMIN/SUPERADMIN por un admin', () => {
      expect(() => controller.register(dto('TEACHER'), null)).not.toThrow();
      expect(() => controller.register(dto('STUDENT'), null)).not.toThrow();
      expect(() =>
        controller.register(dto('ADMIN'), caller('ADMIN')),
      ).not.toThrow();
      expect(() =>
        controller.register(dto('SUPERADMIN'), caller('SUPERADMIN')),
      ).not.toThrow();
    });
  });
});
