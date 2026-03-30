import { useCallback } from "react";
import { MENU_SIDEBAR } from "@/config/layout-11.config";
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
} from '@/components/ui/accordion-menu';
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export function SidebarMenu() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() ?? '';

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path: string): boolean =>
      path === pathname || (path.length > 1 && pathname.startsWith(path) && path !== '/layout-11'),
    [pathname],
  );

  return (
    <ScrollArea className="grow h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-4rem)] my-2.5 lg:my-7.5 px-2.5 me-0.5 pe-2">
      <AccordionMenu
        selectedValue={pathname}
        matchPath={matchPath}
        type="multiple"
        className="space-y-7.5"
        classNames={{
          separator: '-mx-2 mb-2.5',
          label: 'text-xs font-normal text-muted-foreground',
          item: 'h-8.5 px-2.5 text-sm font-normal text-foreground hover:text-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground [&[data-selected=true]_svg]:opacity-100',
          group: '',
        }}
      >
        {MENU_SIDEBAR.map((item, index) => {
          const visibleChildren = item.children?.filter((child) =>
            !child.roles || child.roles.includes(userRole),
          );

          if (!visibleChildren?.length) return null;

          return (
            <AccordionMenuGroup key={index}>
              <AccordionMenuLabel>
                {item.title}
              </AccordionMenuLabel>
              {visibleChildren.map((child, index) => {
                return (
                  <AccordionMenuItem key={index} value={child.path || '#'}>
                    <Link href={child.path || '#'}>
                      {child.icon && <child.icon />}
                      <span>{child.title}</span>
                    </Link>
                  </AccordionMenuItem>
                )
              })}
            </AccordionMenuGroup>
          )
        })}
      </AccordionMenu>
    </ScrollArea>
  );
}
