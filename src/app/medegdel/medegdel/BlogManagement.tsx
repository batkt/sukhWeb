"use client";

import { useEffect, useState, useRef } from "react";
import { Button, Input, Modal, notification, Card, Popconfirm } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, Plus, ImagePlus, X, Edit2, Trash2, MessageSquare, Loader2 } from "lucide-react";
import uilchilgee, { getApiUrl, getMedegdelAssetUrl } from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import useSWR from "swr";
import Aos from "aos";

interface BlogReaction {
  emoji: string;
  count: number;
  users: string[];
  _id?: string;
}

interface BlogImage {
  path: string;
  metadata?: {
    originalName?: string;
    size?: number;
    mimetype?: string;
  };
}

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  images: (string | BlogImage)[];
  baiguullagiinId: string;
  barilgiinId?: string;
  reactions: BlogReaction[];
  createdAt: string;
}

export default function BlogManagement() {
  const { token, ajiltan } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId;
  const { selectedBuildingId } = useBuilding();
  
  useEffect(() => {
    Aos.init({ once: true });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachImages, setAttachImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<(string | BlogImage)[]>([]);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [attachPreviewUrls, setAttachPreviewUrls] = useState<string[]>([]);

  const getImageUrl = (img: any) => {
    if (!img) return "";
    
    // Handle both string paths and object paths as seen in the API response
    let path = "";
    if (typeof img === 'string') {
      path = img;
    } else if (img && typeof img.path === 'string') {
      path = img.path;
    }

    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
    
    const baseUrl = getApiUrl().replace(/\/?$/, ""); // Use api URL as is, just trim trailing slash
    
    // If the path already includes the organization ID (contains a slash), don't prepend it again
    if (path.includes("/")) {
      return `${baseUrl}/${path}`;
    }
    
    return `${baseUrl}/medegdel/${baiguullagiinId}/${path}`;
  };

  const { data: blogData, mutate: revalidateBlogs, isValidating } = useSWR(
    token && baiguullagiinId
      ? ["/blog", token, baiguullagiinId, selectedBuildingId]
      : null,
    async ([url, tkn, bId, barId]) => {
      const res = await uilchilgee(tkn).get(url, {
        params: { baiguullagiinId: bId, barilgiinId: barId },
      });
      const d = res.data;
      const lst = Array.isArray(d?.jagsaalt)
        ? d.jagsaalt
        : Array.isArray(d?.list)
          ? d.list
          : Array.isArray(d?.data)
            ? d.data
            : Array.isArray(d)
              ? d
              : [];
      return lst as BlogPost[];
    }
  );

  const handleOpenModal = (blog: BlogPost | null = null) => {
    if (blog) {
      setEditingBlog(blog);
      setTitle(blog.title);
      setContent(blog.content);
      setExistingImages(blog.images || []);
    } else {
      setEditingBlog(null);
      setTitle("");
      setContent("");
      setExistingImages([]);
    }
    setAttachImages([]);
    setAttachPreviewUrls([]);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      notification.warning({ message: "Гарчиг болон агуулга оруулна уу", style: { zIndex: 99999 } });
      return;
    }

    if (!token || !baiguullagiinId) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("baiguullagiinId", baiguullagiinId);
      if (selectedBuildingId) formData.append("barilgiinId", selectedBuildingId);
      
      attachImages.forEach((file) => formData.append("images", file));
      
      if (editingBlog) {
        // Send paths as strings for the backend to identify which ones to keep
        const pathsToKeep = existingImages.map(img => typeof img === 'string' ? img : img.path);
        formData.append("existingImages", JSON.stringify(pathsToKeep));
      }

      const baseUrl = getApiUrl().replace(/\/$/, "");
      const url = editingBlog ? `${baseUrl}/blog/${editingBlog._id}` : `${baseUrl}/blog`;
      const method = editingBlog ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      openSuccessOverlay(editingBlog ? "Нийтлэл шинэчлэгдлээ" : "Нийтлэл амжилттай нэмэгдлээ");
      setIsModalOpen(false);
      revalidateBlogs();
    } catch (err) {
      console.error("Error saving blog:", err);
      openErrorOverlay("Нийтлэл хадгалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await uilchilgee(token).delete(`/blog/${id}`);
      openSuccessOverlay("Нийтлэл устгагдлаа");
      revalidateBlogs();
    } catch (err) {
      openErrorOverlay("Устгахад алдаа гарлаа");
    }
  };

  const blogs = Array.isArray(blogData) ? blogData : [];
  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    blog.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-0 flex flex-col pt-2 bg-transparent">
      {/* Search and Add Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h2 className="text-lg  text-theme flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Нийтлэлүүд
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative h-10 flex-1 sm:w-64 flex items-center neu-panel">
            <SearchIcon className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              placeholder="Нийтлэл хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full pl-10 pr-3 rounded-2xl bg-transparent border-0 text-sm text-theme placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => handleOpenModal()}
            className="h-10 rounded-xl bg-theme border-0 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            Нийтлэл нэмэх
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isValidating && !blogData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-theme animate-spin" />
            <span className="text-sm text-slate-500">Уншиж байна...</span>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl neu-panel flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base  text-slate-700 dark:text-slate-200">Нийтлэл олдсонгүй</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            <AnimatePresence>
              {filteredBlogs.map((blog) => (
                <motion.div
                  key={blog._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card
                    hoverable
                    className="rounded-2xl border-0 neu-panel overflow-hidden group h-full flex flex-col"
                    cover={
                      blog.images && blog.images.length > 0 ? (
                        <div className="h-40 overflow-hidden relative">
                          <img
                            src={getImageUrl(blog.images[0])}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = ""; // Clear broken images
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                          <ImagePlus className="w-8 h-8 text-slate-300" />
                        </div>
                      )
                    }
                    actions={[
                      <button key="edit" onClick={() => handleOpenModal(blog)} className="w-full flex justify-center py-2 hover:text-theme transition-colors">
                        <Edit2 size={16} />
                      </button>,
                      <Popconfirm
                        key="delete"
                        title="Устгах уу?"
                        onConfirm={() => handleDelete(blog._id)}
                        okText="Тийм"
                        cancelText="Үгүй"
                        placement="topRight"
                      >
                        <button className="w-full flex justify-center py-2 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </Popconfirm>
                    ]}
                  >
                    <div className="flex flex-col h-full">
                      <h3 className="text-sm  line-clamp-1 mb-1.5 text-theme">{blog.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{blog.content}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex -space-x-1">
                          {(blog.reactions || []).slice(0, 3).map((r, i) => (
                            <span key={i} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] border border-white dark:border-slate-900">
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        title={editingBlog ? "Нийтлэл засах" : "Шинэ нийтлэл"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} className="rounded-lg h-10">Цуцлах</Button>,
          <Button key="save" type="primary" loading={loading} onClick={handleSave} className="rounded-lg h-10 bg-theme">Хадгалах</Button>
        ]}
        width={600}
        className="[&_.ant-modal-content]:rounded-3xl"
        destroyOnHidden
      >
        <div className="flex flex-col gap-4 pt-4">
          <div>
            <label className="block text-sm  mb-1 ml-1">Гарчиг</label>
            <Input
              placeholder="Гарчиг..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl bg-slate-50 dark:bg-white/5 border-0 focus:ring-2 focus:ring-theme/30"
            />
          </div>
          
          <div>
            <label className="block text-sm  mb-1 ml-1">Агуулга</label>
            <Input.TextArea
              placeholder="Агуулга..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="rounded-xl bg-slate-50 dark:bg-white/5 border-0 focus:ring-2 focus:ring-theme/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm  mb-1 ml-1">Зураг</label>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group w-16 h-16">
                  <img 
                    src={getImageUrl(url)} 
                    alt="" 
                    className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-white/10" 
                  />
                  <button
                    onClick={() => setExistingImages(p => p.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {attachPreviewUrls.map((url, idx) => (
                <div key={`new-${idx}`} className="relative group w-16 h-16">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-white/10" />
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(url);
                      setAttachPreviewUrls(p => p.filter((_, i) => i !== idx));
                      setAttachImages(p => p.filter((_, i) => i !== idx));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => attachInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-theme hover:text-theme transition-all"
              >
                <Plus size={16} />
              </button>
              <input
                ref={attachInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) {
                    const newFiles = Array.from(files);
                    const newUrls = newFiles.map(f => URL.createObjectURL(f));
                    setAttachPreviewUrls(p => [...p, ...newUrls]);
                    setAttachImages(p => [...p, ...newFiles]);
                  }
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
