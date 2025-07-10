import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";
import Header from "@/components/header";
import FilterSidebar from "@/components/filter-sidebar";
import PostCard from "@/components/post-card";
import PostModal from "@/components/post-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function HomePage() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [filters, setFilters] = useState({
    region: "",
    subject: "",
    targetGrade: ""
  });
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.region) params.append("region", filters.region);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.targetGrade) params.append("targetGrade", filters.targetGrade);
      
      const response = await fetch(`/api/posts?${params}`);
      return response.json();
    }
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handlePostButtonClick = () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setShowPostModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <FilterSidebar onFilterChange={handleFilterChange} />
            
            <div className="mt-6">
              <Button 
                onClick={handlePostButtonClick}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                {user ? "광고 등록" : "로그인 후 광고 등록"}
              </Button>
            </div>
          </aside>

          <div className="lg:w-3/4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">최신 학원 소식</h2>
              <p className="text-gray-600">우리 지역의 학원 소식을 확인하세요</p>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {posts?.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {posts?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">조건에 맞는 게시글이 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showPostModal && user && (
        <PostModal onClose={() => setShowPostModal(false)} />
      )}
    </div>
  );
}
