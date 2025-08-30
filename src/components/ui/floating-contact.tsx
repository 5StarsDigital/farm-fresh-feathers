import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, MessageCircle, Facebook, Send, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactSetting {
  id: string;
  contact_type: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

const iconMap: Record<string, any> = {
  Phone,
  MessageCircle,
  Facebook,
  Send,
  MessageSquare,
};

const FloatingContact = () => {
  const [contacts, setContacts] = useState<ContactSetting[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (contact: ContactSetting) => {
    if (contact.contact_type === 'phone') {
      window.location.href = `tel:${contact.value}`;
    } else {
      window.open(contact.value, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading || contacts.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col items-start space-y-3">
          {/* Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={toggleExpanded}
                className={cn(
                  "w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                  "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary",
                  "animate-pulse-glow"
                )}
                style={{
                  boxShadow: `0 0 20px rgba(var(--primary), 0.3)`,
                }}
              >
                {isExpanded ? (
                  <X className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <MessageSquare className="h-6 w-6 text-primary-foreground animate-bounce" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isExpanded ? 'Đóng' : 'Liên hệ hỗ trợ'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Contact Buttons */}
          <div
            className={cn(
              "flex flex-col space-y-2 transition-all duration-500 ease-out",
              isExpanded 
                ? "opacity-100 translate-x-0 visible" 
                : "opacity-0 -translate-x-4 invisible"
            )}
          >
            {contacts.map((contact, index) => {
              const IconComponent = iconMap[contact.icon] || MessageCircle;
              
              return (
                <Tooltip key={contact.id}>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      onClick={() => handleContactClick(contact)}
                      className={cn(
                        "w-12 h-12 rounded-full shadow-lg transition-all duration-300",
                        "hover:scale-110 hover:shadow-xl transform",
                        "animate-fade-in"
                      )}
                      style={{
                        backgroundColor: contact.color,
                        animationDelay: `${index * 100}ms`,
                        boxShadow: `0 4px 20px ${contact.color}33`,
                      }}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{contact.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Floating Animation Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes pulse-glow {
              0%, 100% {
                box-shadow: 0 0 20px rgba(var(--primary), 0.3);
              }
              50% {
                box-shadow: 0 0 30px rgba(var(--primary), 0.6);
              }
            }
            
            .animate-pulse-glow {
              animation: pulse-glow 2s ease-in-out infinite;
            }
          `
        }} />
      </div>
    </TooltipProvider>
  );
};

export default FloatingContact;