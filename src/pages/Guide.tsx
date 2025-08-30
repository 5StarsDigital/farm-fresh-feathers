import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUp, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GuideSection {
  id: string;
  title: string;
  slug: string;
  content: {
    content: string;
    images: Array<{ url: string; caption: string }>;
    videos: Array<{ url: string; caption: string }>;
  };
  order_index: number;
  icon: string;
  parent_id: string | null;
}

const Guide = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [activeSection, setActiveSection] = useState<GuideSection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedSlug = searchParams.get('section') || 'introduction';

  useEffect(() => {
    fetchGuideSections();
  }, []);

  useEffect(() => {
    if (sections.length > 0) {
      const section = sections.find(s => s.slug === selectedSlug) || sections[0];
      setActiveSection(section);
    }
  }, [sections, selectedSlug]);

  const fetchGuideSections = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_sections')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setSections((data || []).map(item => ({
        ...item,
        content: item.content as {
          content: string;
          images: Array<{ url: string; caption: string }>;
          videos: Array<{ url: string; caption: string }>;
        }
      })));
    } catch (error: any) {
      toast.error('Không thể tải nội dung hướng dẫn');
      console.error('Error fetching guide sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = (slug: string) => {
    setSearchParams({ section: slug });
  };

  const renderMarkdown = (content: string) => {
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 text-foreground">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-foreground">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-3 mt-6 text-foreground">$1</h3>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-2 text-muted-foreground">• $1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n/g, '<br />');
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BookOpen className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Đang tải hướng dẫn...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-center text-foreground">
            Hướng dẫn sử dụng hệ thống
          </h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Tìm hiểu cách sử dụng tất cả các tính năng của hệ thống chăn nuôi gà thông minh
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm trong hướng dẫn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-foreground">Mục lục</h3>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2">
                    {filteredSections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection?.id === section.id ? "default" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => handleSectionSelect(section.slug)}
                      >
                        <span className="mr-2">{section.icon}</span>
                        <span className="truncate">{section.title}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection ? (
              <Card>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <Badge variant="secondary" className="mb-2">
                      {activeSection.icon} {activeSection.title}
                    </Badge>
                  </div>

                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdown(activeSection.content.content) 
                    }}
                  />

                  {/* Images */}
                  {activeSection.content.images && activeSection.content.images.length > 0 && (
                    <div className="mt-8">
                      <Separator className="mb-6" />
                      <h3 className="text-xl font-semibold mb-4">Hình ảnh minh họa</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {activeSection.content.images.map((image, index) => (
                          <div key={index} className="space-y-2">
                            <img 
                              src={image.url} 
                              alt={image.caption}
                              className="w-full rounded-lg border"
                            />
                            {image.caption && (
                              <p className="text-sm text-muted-foreground text-center">
                                {image.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {activeSection.content.videos && activeSection.content.videos.length > 0 && (
                    <div className="mt-8">
                      <Separator className="mb-6" />
                      <h3 className="text-xl font-semibold mb-4">Video hướng dẫn</h3>
                      <div className="space-y-4">
                        {activeSection.content.videos.map((video, index) => (
                          <div key={index} className="space-y-2">
                            <div className="aspect-video">
                              <iframe
                                src={video.url}
                                className="w-full h-full rounded-lg"
                                allowFullScreen
                                title={video.caption}
                              />
                            </div>
                            {video.caption && (
                              <p className="text-sm text-muted-foreground text-center">
                                {video.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Không tìm thấy nội dung</h3>
                  <p className="text-muted-foreground">
                    Vui lòng chọn một mục từ danh sách bên trái
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Navigation between sections */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === activeSection?.id);
              const prevSection = sections[currentIndex - 1];
              if (prevSection) handleSectionSelect(prevSection.slug);
            }}
            disabled={!activeSection || sections.findIndex(s => s.id === activeSection.id) === 0}
          >
            ← Phần trước
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === activeSection?.id);
              const nextSection = sections[currentIndex + 1];
              if (nextSection) handleSectionSelect(nextSection.slug);
            }}
            disabled={!activeSection || sections.findIndex(s => s.id === activeSection.id) === sections.length - 1}
          >
            Phần tiếp → 
          </Button>
        </div>

        {/* Back to top button */}
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full w-12 h-12"
          size="icon"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default Guide;