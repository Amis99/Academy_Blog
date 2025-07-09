import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, PostWithAuthor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Check, X, Trash2, Users, FileText } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  if (!user || !user.isAdmin) {
    navigate("/");
    return null;
  }

  const { data: pendingUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/pending-users"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  const approveUserMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      await apiRequest("POST", `/api/admin/approve-user/${userId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      toast({
        title: "성공",
        description: "사용자 상태가 업데이트되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "사용자 상태 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/admin/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "성공",
        description: "게시글이 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "게시글 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">관리자 패널</h1>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
            >
              홈으로
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* User Approval Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>가입 승인 대기</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">승인 대기 중인 사용자가 없습니다.</p>
                  ) : (
                    pendingUsers?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.phone}</p>
                            </div>
                            <Badge variant="secondary">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveUserMutation.mutate({ userId: user.id, status: "approved" })}
                            disabled={approveUserMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => approveUserMutation.mutate({ userId: user.id, status: "rejected" })}
                            disabled={approveUserMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            거부
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>게시글 관리</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">게시글이 없습니다.</p>
                  ) : (
                    posts?.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-sm text-gray-500">
                                {post.author.username} • {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Badge variant="outline">{post.region}</Badge>
                              <Badge variant="outline">{post.subject}</Badge>
                              <Badge variant="outline">{post.targetGrade}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          disabled={deletePostMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
