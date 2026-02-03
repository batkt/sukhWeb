// Employee Permission Types and Constants
// This file defines all available permissions for employees (ajiltan)

export interface PermissionItem {
  id: string;
  label: string;
  description?: string;
  children?: PermissionItem[];
}

// All available menu and settings permissions
export const ALL_PERMISSIONS: PermissionItem[] = [
  {
    id: "khynalt",
    label: "Хяналт",
    description: "Хяналтын самбар харах эрх",
  },
  {
    id: "geree",
    label: "Гэрээ",
    description: "Гэрээний мэдээлэл харах, засах эрх",
    children: [
      { id: "geree.kharakh", label: "Харах", description: "Гэрээ харах" },
      { id: "geree.nemekh", label: "Нэмэх", description: "Гэрээ нэмэх" },
      { id: "geree.zasakh", label: "Засах", description: "Гэрээ засах" },
      { id: "geree.ustgakh", label: "Устгах", description: "Гэрээ устгах" },
    ],
  },
  {
    id: "tulbur",
    label: "Төлбөр",
    description: "Төлбөрийн мэдээлэл харах эрх",
    children: [
      { id: "tulbur.nekhemjlekh", label: "Нэхэмжлэх", description: "Нэхэмжлэх харах" },
      { id: "tulbur.khungulult", label: "Хөнгөлөлт", description: "Хөнгөлөлт удирдах" },
      { id: "tulbur.guilgeeTuukh", label: "Гүйлгээний түүх", description: "Гүйлгээний түүх харах" },
      { id: "tulbur.ebarimt", label: "Э-баримт", description: "Э-баримт харах" },
    ],
  },
  {
    id: "tailan",
    label: "Тайлан",
    description: "Тайлангийн мэдээлэл харах эрх",
    children: [
      { id: "tailan.orlogoAvlaga", label: "Орлого авлага", description: "Орлого авлагын тайлан" },
      { id: "tailan.sariinTulbur", label: "Сарын төлбөр", description: "Сарын төлбөрийн тайлан" },
      { id: "tailan.nekhemjlekhiinTuukh", label: "Нэхэмжлэхийн түүх", description: "Нэхэмжлэхийн түүх" },
      { id: "tailan.avlagiinNasjilt", label: "Авлагийн насжилт", description: "Авлагийн насжилт" },
    ],
  },
  {
    id: "medegdel",
    label: "Мэдэгдэл",
    description: "Мэдэгдэл харах, илгээх эрх",
    children: [
      { id: "medegdel.medegdel", label: "Мэдэгдэл", description: "Мэдэгдэл харах" },
      { id: "medegdel.sanalKhuselt", label: "Санал хүсэлт", description: "Санал хүсэлт харах" },
    ],
  },
  {
    id: "zogsool",
    label: "Зогсоол",
    description: "Зогсоолын мэдээлэл харах эрх",
    children: [
      { id: "zogsool.jagsaalt", label: "Жагсаалт", description: "Зогсоолын жагсаалт" },
      { id: "zogsool.camera", label: "Камер касс", description: "Камер касс харах" },
      { id: "zogsool.cameraKhyanalt", label: "Камерын хяналт", description: "Камерын хяналт" },
      { id: "zogsool.orshinSuugch", label: "Оршин суугч", description: "Оршин суугчийн мэдээлэл" },
    ],
  },
];


// Helper function to get all permission IDs (flat list)
export function getAllPermissionIds(): string[] {
  const ids: string[] = [];
  
  function traverse(items: PermissionItem[]) {
    for (const item of items) {
      ids.push(item.id);
      if (item.children) {
        traverse(item.children);
      }
    }
  }
  
  traverse(ALL_PERMISSIONS);
  return ids;
}

// Helper function to check if a permission ID is valid
export function isValidPermission(permissionId: string): boolean {
  return getAllPermissionIds().includes(permissionId);
}

// Helper function to get permission label by ID
export function getPermissionLabel(permissionId: string): string {
  function findLabel(items: PermissionItem[]): string | null {
    for (const item of items) {
      if (item.id === permissionId) return item.label;
      if (item.children) {
        const found = findLabel(item.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  return findLabel(ALL_PERMISSIONS) || permissionId;
}

// Helper function to get parent permission ID
export function getParentPermissionId(permissionId: string): string | null {
  const parts = permissionId.split('.');
  if (parts.length > 1) {
    parts.pop();
    return parts.join('.');
  }
  return null;
}

export function getChildPermissionIds(permissionId: string): string[] {
  const ids: string[] = [];
  
  function findAndTraverse(items: PermissionItem[]): boolean {
    for (const item of items) {
      if (item.id === permissionId) {
        if (item.children) {
          function traverse(children: PermissionItem[]) {
            for (const child of children) {
              ids.push(child.id);
              if (child.children) traverse(child.children);
            }
          }
          traverse(item.children);
        }
        return true;
      }
      if (item.children && findAndTraverse(item.children)) {
        return true;
      }
    }
    return false;
  }
  
  findAndTraverse(ALL_PERMISSIONS);
  return ids;
}
