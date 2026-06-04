"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      {/* 링크 영역 */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[1550px] px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm" aria-label="푸터 링크">
            <Link
              href="/privacy"
              className="font-semibold text-foreground transition-colors hover:text-primary"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/guide"
              className="text-gray-600 transition-colors hover:text-foreground"
            >
              이용안내
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 transition-colors hover:text-foreground"
            >
              이용약관
            </Link>
            <Link
              href="/email-policy"
              className="text-gray-600 transition-colors hover:text-foreground"
            >
              이메일무단수집거부
            </Link>
          </nav>
        </div>
      </div>
      
      {/* 기관 정보 */}
      <div className="mx-auto max-w-[1550px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logo-lc.png"
              alt="한국도로공사 토지정보"
              width={140}
              height={28}
              className="h-7"
              style={{ width: "auto", height: "auto" }}
            />
            <div className="border-l border-gray-200 pl-4">
              <p className="text-xs text-gray-500">
                (39660) 경상북도 김천시 혁신8로 77 (율곡동 941) 한국도로공사
              </p>
              <p className="text-xs text-gray-500">
                대표전화 1588-2504
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="https://www.ex.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
            >
              한국도로공사
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="https://exland.ex.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
            >
              토지보상시스템
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        
        <p className="mt-4 text-xs text-gray-400">
          © {currentYear} Korea Expressway Corporation. All Rights reserved.
        </p>
      </div>
    </footer>
  );
}
