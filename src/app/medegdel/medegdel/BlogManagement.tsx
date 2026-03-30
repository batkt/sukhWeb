"use client";

import { useEffect, useState, useRef } from "react";
import { Input, Modal, notification, Card, Popconfirm } from "antd";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, Plus, ImagePlus, X, Edit2, Trash2, MessageSquare, Loader2 } from "lucide-react";
import uilchilgee, { getApiUrl, getMedegdelAssetUrl } from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import useSWR from "swr";
import Aos from "aos";
import { StandardPagination } from "@/components/ui/StandardTable";
import ExpandableCardDemo from "@/components/ui/expandable-card-demo-grid";

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
  
  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(16);
  
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

  const paginatedBlogs = filteredBlogs.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedBuildingId]);

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
          <div className="flex flex-col gap-6">
            <div className="pb-4">
              <ExpandableCardDemo
                cards={paginatedBlogs.map(blog => ({
                  _id: blog._id,
                  title: blog.title,
                  description: new Date(blog.createdAt).toLocaleDateString(),
                  src: blog.images && blog.images.length > 0 ? getImageUrl(blog.images[0]) : "/placeholder-blog.png",
                  previewContent: blog.content,
                  content: () => (
                    <div className="space-y-4">
                      {/* Detailed Content */}
                      <div className="flex flex-col gap-4">
                        <p className="whitespace-pre-wrap leading-relaxed text-neutral-700 dark:text-neutral-300">
                          {blog.content}
                        </p>
                        
                        {/* Reactions in expanded view */}
                        {(blog.reactions && blog.reactions.length > 0) && (
                          <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            {blog.reactions.map((r, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-sm">
                                <span className="text-base">{r.emoji}</span>
                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{r.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(blog);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit2 size={14} /> Засах
                        </Button>
                        <Popconfirm
                          title="Устгах уу?"
                          onConfirm={() => handleDelete(blog._id)}
                          okText="Тийм"
                          cancelText="Үгүй"
                        >
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Устгах
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  ),
                  originalData: blog
                }))}
              />
            </div>

            <StandardPagination
              current={page}
              total={filteredBlogs.length}
              pageSize={rowsPerPage}
              onChange={setPage}
              onPageSizeChange={setRowsPerPage}
              pageSizeOptions={[6, 9, 12, 24]}
            />
          </div>
        )}
      </div>

      <Modal
        title={editingBlog ? "Нийтлэл засах" : "Шинэ нийтлэл"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} className="rounded-lg h-10">Хаах</Button>,
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
