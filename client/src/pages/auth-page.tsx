import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { GraduationCap, Users, BookOpen, Star } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  confirmPassword: z.string(),
  phone: z.string().min(1, "전화번호를 입력해주세요"),
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      phone: ""
    }
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      await loginMutation.mutateAsync(data);
      navigate("/");
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    try {
      await registerMutation.mutateAsync({
        username: data.username,
        password: data.password,
        phone: data.phone
      });
      navigate("/");
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">학원광장</h1>
            <p className="text-gray-600">학원 홍보 플랫폼에 오신 것을 환영합니다</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">시작하기</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">로그인</TabsTrigger>
                  <TabsTrigger value="register">회원가입</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="username">대화명</Label>
                      <Input
                        id="username"
                        {...loginForm.register("username")}
                        placeholder="대화명을 입력하세요"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-600">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">비밀번호</Label>
                      <Input
                        id="password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="비밀번호를 입력하세요"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "로그인 중..." : "로그인"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div>
                      <Label htmlFor="reg-username">대화명</Label>
                      <Input
                        id="reg-username"
                        {...registerForm.register("username")}
                        placeholder="대화명을 입력하세요"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="reg-password">비밀번호</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="비밀번호를 입력하세요"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirm-password">비밀번호 확인</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        placeholder="비밀번호를 다시 입력하세요"
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">전화번호</Label>
                      <Input
                        id="phone"
                        {...registerForm.register("phone")}
                        placeholder="010-1234-5678"
                      />
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">안내:</span> 가입 신청 후 관리자 승인이 필요합니다.
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "가입 신청 중..." : "가입 신청"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:block flex-1 bg-blue-600 text-white">
        <div className="h-full flex items-center justify-center p-12">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6">학원광장</h2>
            <p className="text-xl mb-8">학원과 학부모를 연결하는 믿을 수 있는 플랫폼</p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-6 h-6" />
                <span>검증된 학원 정보</span>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6" />
                <span>다양한 과목과 학년</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6" />
                <span>지역별 맞춤 정보</span>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="w-6 h-6" />
                <span>실시간 업데이트</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
