import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, PostWithAuthor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Check, X, Trash2, Users, FileText, Ban, UserCheck, AlertTriangle } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [banReason, setBanReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

  const { data: pendingUsers, isLoading: pendingUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/pending-users"],
  });

  const { data: allUsers, isLoading: allUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: bannedUsers, isLoading: bannedUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/banned-users"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  // Check auth after all hooks are called
  if (!user || !user.isAdmin) {
    navigate("/");
    return null;
  }

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

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      await apiRequest("POST", `/api/admin/ban-user/${userId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banned-users"] });
      setIsBanDialogOpen(false);
      setBanReason("");
      setSelectedUser(null);
      toast({
        title: "성공",
        description: "사용자가 강퇴되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "사용자 강퇴에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/admin/unban-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banned-users"] });
      toast({
        title: "성공",
        description: "사용자 강퇴가 해제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "강퇴 해제에 실패했습니다.",
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

  const cleanupOldPostsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/posts/cleanup/old");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "성공",
        description: `3일 이전 게시글이 삭제되었습니다.`,
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "오래된 게시글 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setIsBanDialogOpen(true);
  };

  const confirmBanUser = () => {
    if (selectedUser) {
      banUserMutation.mutate({ userId: selectedUser.id, reason: banReason });
    }
  };

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
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
            <TabsTrigger value="users">전체 회원</TabsTrigger>
            <TabsTrigger value="banned">강퇴 회원</TabsTrigger>
            <TabsTrigger value="posts">게시글 관리</TabsTrigger>
          </TabsList>

          {/* Pending Users Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5" />
                  <span>가입 승인 대기</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsersLoading ? (
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
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>전체 회원 관리</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allUsersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allUsers?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">회원이 없습니다.</p>
                    ) : (
                      allUsers?.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-gray-500">{user.phone}</p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge variant={user.status === "approved" ? "default" : user.status === "banned" ? "destructive" : "secondary"}>
                                  {user.status === "approved" ? "승인됨" : user.status === "banned" ? "강퇴됨" : user.status === "pending" ? "대기중" : "거부됨"}
                                </Badge>
                                {user.isAdmin && (
                                  <Badge variant="outline">관리자</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {user.status === "approved" && !user.isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBanUser(user)}
                              disabled={banUserMutation.isPending}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              강퇴
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banned Users Tab */}
          <TabsContent value="banned">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>강퇴된 회원</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bannedUsersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bannedUsers?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">강퇴된 회원이 없습니다.</p>
                    ) : (
                      bannedUsers?.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-gray-500">{user.phone}</p>
                                {user.banReason && (
                                  <p className="text-sm text-red-600">사유: {user.banReason}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Badge variant="destructive">강퇴됨</Badge>
                                {user.bannedAt && (
                                  <Badge variant="secondary">
                                    {new Date(user.bannedAt).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unbanUserMutation.mutate(user.id)}
                            disabled={unbanUserMutation.isPending}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            강퇴 해제
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>게시글 관리</span>
                  </div>
                  <Button
                    onClick={() => cleanupOldPostsMutation.mutate()}
                    disabled={cleanupOldPostsMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    3일 이전 게시글 정리
                  </Button>
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
          </TabsContent>
        </Tabs>

        {/* Ban User Dialog */}
        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 강퇴</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="banReason">강퇴 사유</Label>
                <Textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="강퇴 사유를 입력하세요..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
                  취소
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmBanUser}
                  disabled={banUserMutation.isPending}
                >
                  강퇴
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}