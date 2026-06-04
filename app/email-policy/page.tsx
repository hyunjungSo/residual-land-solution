import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function EmailPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="mb-8 text-3xl font-bold">이메일무단수집거부</h1>
          
          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">이메일 무단수집 거부 안내</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 
                이용하여 무단으로 수집되는 것을 거부하며, 이를 위반 시 정보통신망법에 의해 형사 
                처벌됨을 유념하시기 바랍니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">관련 법령</h2>
              <div className="rounded-lg border bg-muted/30 p-4">
                <h3 className="mb-2 font-medium">정보통신망 이용촉진 및 정보보호 등에 관한 법률</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  <strong>제50조의2 (전자우편주소의 무단 수집행위 등 금지)</strong>
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>누구든지 전자우편주소의 수집을 거부하는 의사가 명시된 인터넷 홈페이지에서 자동으로 전자우편주소를 수집하는 프로그램 그 밖의 기술적 장치를 이용하여 전자우편주소를 수집하여서는 아니 된다.</li>
                  <li>누구든지 제1항의 규정을 위반하여 수집된 전자우편주소를 판매·유통하여서는 아니 된다.</li>
                  <li>누구든지 제1항 및 제2항의 규정에 의하여 수집·판매 및 유통이 금지된 전자우편주소임을 알고 이를 정보전송에 이용하여서는 아니 된다.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">위반 시 처벌</h2>
              <p className="text-muted-foreground leading-relaxed">
                위 규정을 위반하여 전자우편주소를 수집·판매·유통하거나 정보전송에 이용한 자는 
                <strong className="text-foreground"> 1년 이하의 징역 또는 1천만원 이하의 벌금</strong>에 처해질 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">문의</h2>
              <p className="text-muted-foreground">
                본 정책에 관한 문의사항이 있으시면 아래 연락처로 문의해 주시기 바랍니다.
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>전화: 1588-0000</li>
                <li>이메일: support@lh.or.kr</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
