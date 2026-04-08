"use client";

import { useEffect, useState, useRef } from "react";
import { Input, Modal, notification, Popconfirm } from "antd";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";
import { SearchIcon, Plus, X, Edit2, Trash2, MessageSquare, Loader2 } from "lucide-react";
import uilchilgee, { getApiUrl } from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import useSWR from "swr";
import Aos from "aos";
import { StandardPagination } from "@/components/ui/StandardTable";

interface BlogReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  images: string[];
  baiguullagiinId: string;
  barilgiinId?: string;
  reactions: BlogReaction[];
  createdAt: string;
}

export default function BlogNiitlelPage() {
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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [attachPreviewUrls, setAttachPreviewUrls] = useState<string[]>([]);
  const [existingImagesBackup, setExistingImagesBackup] = useState<string[]>([]);
  const [autoReplacedExisting, setAutoReplacedExisting] = useState(false);
  const clearNewAttachments = () => {
    attachPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setAttachPreviewUrls([]);
    setAttachImages([]);
  };
  const closeModal = () => {
    clearNewAttachments();
    setIsModalOpen(false);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const { data: blogData, mutate: revalidateBlogs, isValidating } = useSWR(
    token && baiguullagiinId
      ? ["/blog", token, baiguullagiinId, selectedBuildingId]
      : null,
    async ([url, tkn, bId, barId]) => {
      const res = await uilchilgee(tkn).get(url, {
        params: { baiguullagiinId: bId, barilgiinId: barId },
      });
      const d = res.data;
      // Normalize various response shapes
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
      setExistingImagesBackup(blog.images || []);
      setAutoReplacedExisting(false);
    } else {
      setEditingBlog(null);
      setTitle("");
      setContent("");
      setExistingImages([]);
      setExistingImagesBackup([]);
      setAutoReplacedExisting(false);
    }
    setAttachImages([]);
    setAttachPreviewUrls([]);
    setIsModalOpen(true);
  };
  useEffect(() => {
    return () => {
      attachPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      
      // If editing, we might need to send which existing images to keep
      if (editingBlog) {
        formData.append("existingImages", JSON.stringify(existingImages));
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
      closeModal();
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
  const pagedBlogs = filteredBlogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !loading) {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, loading, title, content, attachImages, existingImages, editingBlog]);

  return (
    <div className="min-h-0 flex flex-col p-4 sm:p-6 md:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl neu-panel flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-theme" />
          </div>
          <div>
            <h1 className="text-xl  text-theme">Нийтлэл</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Мэдээ, мэдээлэл болон нийтлэл удирдах</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative h-10 flex-1 sm:w-64 flex items-center neu-panel">
            <SearchIcon className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              placeholder="Хайх..."
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
            Нэмэх
          </Button>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isValidating && !blogData ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-theme animate-spin" />
            <span className="text-sm text-slate-500">Уншиж байна...</span>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="table-surface rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5 mb-4">
              <div className="max-h-[calc(100vh-320px)] overflow-auto custom-scrollbar">
                {pagedBlogs.length === 0 ? (
                  <div className="py-16 text-center text-sm text-slate-500">
                    Нийтлэл олдсонгүй
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pagedBlogs.map((blog) => (
                      <article
                        key={blog._id}
                        className="h-[380px] rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col"
                      >
                        <div className="h-1/2 bg-slate-100">
                          <img
                            src={blog.images?.[0] || "/placeholder-blog.png"}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="h-1/2 bg-white border-t border-slate-200 p-4 flex flex-col">
                          <h3 className="text-sm font-medium text-slate-900 line-clamp-1 mb-1">{blog.title}</h3>
                          <p className="text-[11px] text-slate-500 mb-2">
                            {new Date(blog.createdAt).toLocaleString("mn-MN")}
                          </p>
                          <p className="text-sm text-slate-600 line-clamp-3 flex-1">
                            {blog.content}
                          </p>
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(blog)}
                              className="h-8 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 text-xs"
                              title="Засах"
                            >
                              <Edit2 size={14} />
                              Засах
                            </button>
                            <Popconfirm
                              title="Нийтлэлийг устгах уу?"
                              onConfirm={() => handleDelete(blog._id)}
                              okText="Тийм"
                              cancelText="Үгүй"
                              placement="topRight"
                            >
                              <button
                                className="h-8 px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5 text-xs"
                                title="Устгах"
                              >
                                <Trash2 size={14} />
                                Устгах
                              </button>
                            </Popconfirm>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <StandardPagination
              current={currentPage}
              total={filteredBlogs.length}
              pageSize={pageSize}
              onChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
              pageSizeOptions={[100, 200, 300, 400, 500, 1000]}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={editingBlog ? "Нийтлэл засах" : "Шинэ нийтлэл"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal} className="rounded-lg h-10">Хаах</Button>,
          <Button key="save" type="primary" loading={loading} onClick={handleSave} className="rounded-lg h-10 bg-theme">Хадгалах (Ctrl+Enter)</Button>
        ]}
        width={600}
        className="[&_.ant-modal-content]:rounded-3xl [&_.ant-modal-header]:bg-transparent"
        destroyOnHidden
      >
        <div className="flex flex-col gap-5 pt-4">
          <div className="text-xs text-slate-500">
            {editingBlog ? "Засварлах горим" : "Шинэ нийтлэл"} - зураг устгах/цэвэрлэхийг доорх товчоор нэг дор хийж болно.
          </div>
          <div>
            <label className="block text-sm  text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Гарчиг</label>
            <Input
              placeholder="Нийтлэлийн гарчиг..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-0 focus:ring-2 focus:ring-theme/30"
            />
          </div>
          
          <div>
            <label className="block text-sm  text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Агуулга</label>
            <Input.TextArea
              placeholder="Нийтлэлийн агуулга бичих..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="rounded-xl bg-slate-50 dark:bg-white/5 border-0 focus:ring-2 focus:ring-theme/30 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label className="block text-sm text-slate-700 dark:text-slate-300">Зураг</label>
              <div className="flex items-center gap-2">
                {autoReplacedExisting && existingImagesBackup.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExistingImages(existingImagesBackup);
                      setAutoReplacedExisting(false);
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Буцаах
                  </button>
                )}
                {existingImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExistingImages([])}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    Хуучин зургуудыг цэвэрлэх
                  </button>
                )}
                {attachImages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNewAttachments}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    Шинэ зургуудыг цэвэрлэх
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Existing Images */}
              {existingImages.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group w-20 h-20">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-white/10" />
                  <button
                    onClick={() => setExistingImages(p => p.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {/* New Attachments */}
              {attachPreviewUrls.map((url, idx) => (
                <div key={`new-${idx}`} className="relative group w-20 h-20">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-white/10" />
                  <button
                    onClick={() => {
                      setAttachPreviewUrls(p => p.filter((_, i) => i !== idx));
                      setAttachImages(p => p.filter((_, i) => i !== idx));
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => attachInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-theme hover:text-theme transition-all"
              >
                <Plus size={20} />
                <span className="text-[10px]">Нэмэх</span>
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
                    // Edit workflow simplification:
                    // selecting new image(s) auto-replaces old ones to avoid manual delete clicks.
                    if (editingBlog && existingImages.length > 0) {
                      setExistingImagesBackup(existingImages);
                      setExistingImages([]);
                      setAutoReplacedExisting(true);
                    }
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
