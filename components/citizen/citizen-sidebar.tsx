"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  children?: {
    id: string;
    label: string;
    href: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    id: "residual-land",
    label: "잔여지 보상",
    children: [
      { id: "new", label: "신규 신청", href: "/citizen?tab=new" },
      { id: "status", label: "신청현황 조회", href: "/citizen?tab=status" },
    ],
  },
];

interface CitizenSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function CitizenSidebar({ activeTab, onTabChange }: CitizenSidebarProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "new";
  
  // 기본적으로 잔여지 보상 메뉴 열어두기
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["residual-land"]));

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href.includes("?tab=")) {
      const tabValue = href.split("tab=")[1];
      return currentTab === tabValue;
    }
    return false;
  };

  const handleSubMenuClick = (href: string) => {
    if (onTabChange) {
      const tabMatch = href.match(/tab=(\w+)/);
      if (tabMatch) {
        onTabChange(tabMatch[1]);
      }
    }
  };

  return (
    <aside className="w-[280px] flex-shrink-0">
      <div className="rounded-lg shadow-md overflow-hidden bg-white">
        {/* 헤더 - 녹색 배경, 둥근 상단 모서리 */}
        <div className="bg-[#2E8B57] text-white px-6 py-8 text-center">
          <h2 className="text-xl font-bold">마이페이지</h2>
        </div>
        
        {/* 메뉴 */}
        <nav>
          {menuItems.map((menu, index) => {
            const isExpanded = expandedMenus.has(menu.id);
            
            return (
              <div key={menu.id}>
                {/* 상위 메뉴 버튼 */}
                <button
                  onClick={() => toggleMenu(menu.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 text-left font-medium transition-colors",
                    isExpanded 
                      ? "bg-[#2E8B57] text-white" 
                      : "bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-200"
                  )}
                >
                  <span>{menu.label}</span>
                  {isExpanded ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
                
                {/* 하위 메뉴 */}
                {menu.children && isExpanded && (
                  <div className="bg-white border-b border-gray-200">
                    {menu.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleSubMenuClick(child.href)}
                        className={cn(
                          "w-full text-left px-5 py-3 text-sm transition-colors",
                          isActive(child.href)
                            ? "text-[#2E8B57] font-medium"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        <span className="text-gray-400 mr-2">-</span>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
