"use client";

import {
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  Button,
  Link,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@nextui-org/react";
import { useAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";
import { BookOpen, LogOut, LogIn, Menu, Home, Info, Phone } from "lucide-react";
import { useState, useEffect } from "react";

export default function AppNavbar() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: "صفحه اصلی", href: "/", icon: <Home className="w-4 h-4" /> },
    { name: "درباره ما", href: "/about", icon: <Info className="w-4 h-4" /> },
    { name: "تماس با ما", href: "/contact", icon: <Phone className="w-4 h-4" /> },
  ];

  return (
    <Navbar 
      maxWidth="xl" 
      className={`
        transition-all duration-300 ease-in-out
        ${scrolled ? 'py-2 bg-background/80' : 'py-3 bg-background'}
        backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50
      `}
      classNames={{
        wrapper: "px-4 sm:px-6",
        item: [
          "flex",
          "relative",
          "h-full",
          "items-center",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-0",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[1px]",
          "data-[active=true]:after:bg-primary",
          "after:transition-all",
          "after:duration-300",
        ],
      }}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <div className="animate-float">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <p className="font-bold text-inherit text-lg hidden sm:block hover:text-primary transition-colors">
            سیستم مدیریت نمرات
          </p>
        </NavbarBrand>

        <NavbarContent className="hidden sm:flex gap-6 px-6" justify="center">
          {menuItems.map((item) => (
            <NavbarItem key={item.href} isActive={pathname === item.href}>
              <Link 
                color="foreground" 
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-[0.95rem] font-medium transition-all duration-300 hover:text-primary group"
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </NavbarContent>

      <NavbarContent justify="end" className="basis-1/5 sm:basis-full gap-4">
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        {token ? (
          <NavbarItem>
            <Button 
              color="danger" 
              variant="flat"
              startContent={<LogOut className="w-4 h-4" />}
              className="font-medium transition-transform hover:scale-105"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              خروج
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Button 
              as={Link} 
              color="primary" 
              href="/login" 
              variant="shadow"
              startContent={<LogIn className="w-4 h-4" />}
              className="font-medium bg-gradient-to-r from-primary-500 to-primary-600 transition-transform hover:scale-105"
            >
              ورود به سامانه
            </Button>
          </NavbarItem>
        )}
        <NavbarMenuToggle
          className="sm:hidden"
          icon={<Menu className="w-5 h-5" />}
        />
      </NavbarContent>

      <NavbarMenu className="pt-6 bg-background/80 backdrop-blur-lg">
        {menuItems.map((item, index) => (
          <NavbarMenuItem 
            key={`${item.name}-${index}`}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Link
              color="foreground"
              className="w-full flex items-center gap-2 py-2 hover:text-primary transition-colors text-lg"
              href={item.href}
              size="lg"
            >
              {item.icon}
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
