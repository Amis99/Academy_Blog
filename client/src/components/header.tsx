import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/auth");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">학원광장</h1>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-900 hover:text-blue-600 transition-colors">
              홈
            </Link>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">지역별</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">과목별</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">이벤트</a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <span className="text-sm">
                      상태: {user.status === "approved" ? "승인됨" : user.status === "pending" ? "승인 대기" : "거부됨"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user.isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="w-4 h-4 mr-2" />
                      관리자 패널
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate("/auth")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
