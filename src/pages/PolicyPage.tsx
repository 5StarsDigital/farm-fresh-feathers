import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, AlertTriangle } from 'lucide-react';

interface PolicyPage {
  id: string;
  slug: string;
  title: string;
  content: {
    content: string;
    images: any[];
    videos: any[];
  };
  meta_description: string;
  created_at: string;
  updated_at: string;
}

const PolicyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  // Use the slug from URL params, fallback to a default or handle appropriately
  const currentSlug = slug || window.location.pathname.substring(1);
  const [policyPage, setPolicyPage] = useState<PolicyPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      if (!currentSlug) {
        setError('Không tìm thấy trang');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('policy_pages')
          .select('*')
          .eq('slug', currentSlug)
          .eq('is_active', true)
          .single();

        if (error) {
          setError('Không tìm thấy nội dung');
        } else {
          setPolicyPage(data as unknown as PolicyPage);
          
          // Update page title and meta description
          if (data) {
            document.title = `${data.title} - Nuôi Gà 5Stars`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
              metaDesc.setAttribute('content', data.meta_description || '');
            }
          }
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải trang');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [currentSlug]);

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-foreground">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-4 text-foreground mt-8">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-3 text-foreground mt-6">$1</h3>')
      .replace(/^- (.*$)/gm, '<li class="ml-6 mb-2 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-6 mb-2 list-decimal">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  const getIcon = (slug?: string) => {
    switch (slug) {
      case 'privacy':
        return <Shield className="w-8 h-8 text-primary" />;
      case 'warranty':
        return <AlertTriangle className="w-8 h-8 text-primary" />;
      case 'terms':
        return <FileText className="w-8 h-8 text-primary" />;
      default:
        return <FileText className="w-8 h-8 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !policyPage) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-destructive">
                <AlertTriangle className="w-8 h-8" />
                Không tìm thấy trang
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                {error || 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'}
              </p>
              <a 
                href="/" 
                className="text-primary hover:underline font-medium"
              >
                ← Quay về trang chủ
              </a>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              {getIcon(policyPage.slug)}
              <h1 className="text-4xl font-bold text-foreground">
                {policyPage.title}
              </h1>
            </div>
            
            {policyPage.meta_description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {policyPage.meta_description}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
              <span>Cập nhật lần cuối: {new Date(policyPage.updated_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* Content */}
          <Card>
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ 
                  __html: `<p class="mb-4">${renderMarkdown(policyPage.content.content)}</p>`
                }}
              />
              
              {/* Images */}
              {policyPage.content.images && policyPage.content.images.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Hình ảnh minh họa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {policyPage.content.images.map((img: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <img 
                          src={img.url} 
                          alt={img.caption || `Hình ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg shadow-md"
                        />
                        {img.caption && (
                          <p className="text-sm text-muted-foreground text-center">
                            {img.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {policyPage.content.videos && policyPage.content.videos.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Video hướng dẫn</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {policyPage.content.videos.map((video: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="relative aspect-video">
                          <iframe
                            src={video.url}
                            title={video.title || `Video ${index + 1}`}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                          />
                        </div>
                        {video.title && (
                          <p className="text-sm text-muted-foreground text-center">
                            {video.title}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center">Cần hỗ trợ thêm?</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Nếu bạn có thắc mắc về nội dung này, vui lòng liên hệ với chúng tôi:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <a href="tel:0985246666" className="flex items-center gap-2 text-primary hover:underline">
                  📞 Hotline: 0985.24.6666
                </a>
                <a href="mailto:support@nuoiga5stars.vn" className="flex items-center gap-2 text-primary hover:underline">
                  ✉️ Email: support@nuoiga5stars.vn
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PolicyPage;