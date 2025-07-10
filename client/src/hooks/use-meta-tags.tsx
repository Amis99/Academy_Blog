import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface MetaInfo {
  title: string;
  description: string;
  authors: string[];
}

export function useMetaTags() {
  const { data: metaInfo } = useQuery<MetaInfo>({
    queryKey: ["/meta-info"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (metaInfo) {
      // Update page title
      document.title = metaInfo.title;

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", metaInfo.description);
      }

      // Update Open Graph meta tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute("content", metaInfo.title);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute("content", metaInfo.description);
      }

      // Update Twitter Card meta tags
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute("content", metaInfo.title);
      }

      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute("content", metaInfo.description);
      }
    }
  }, [metaInfo]);

  return metaInfo;
}