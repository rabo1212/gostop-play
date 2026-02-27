'use client';

import { useRouter } from 'next/navigation';

export default function RulesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-base px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="text-xs text-text-muted hover:text-gold transition-colors cursor-pointer mb-4"
        >
          ← 뒤로
        </button>

        <h1 className="text-2xl font-display font-bold text-gold mb-6">고스톱 규칙</h1>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          {/* 기본 설명 */}
          <Section title="게임 소개">
            <p>고스톱은 화투 48장으로 3명이 하는 카드 게임입니다.</p>
            <p>같은 월의 카드를 매칭하여 먹고, 모은 카드로 점수를 냅니다.</p>
          </Section>

          <Section title="카드 종류">
            <div className="space-y-1">
              <CardType emoji="🌟" name="광 (5장)" desc="가장 높은 가치. 1, 3, 8, 11, 12월에 1장씩" />
              <CardType emoji="🦌" name="열끗 (9장)" desc="동물/특수 그림 카드. 2, 4, 5, 6, 7, 8, 9, 10, 12월" />
              <CardType emoji="📜" name="띠 (10장)" desc="홍단(1,2,3월), 청단(6,9,10월), 초단(4,5,7월)" />
              <CardType emoji="🍃" name="피 (24장)" desc="나머지. 쌍피는 2장으로 카운트" />
            </div>
          </Section>

          <Section title="진행 방식">
            <ol className="list-decimal list-inside space-y-1">
              <li>각 플레이어에게 7장, 바닥에 6장, 나머지는 뽑을 더미</li>
              <li>내 차례: 손패 1장을 바닥에 내려 같은 월과 매칭</li>
              <li>뽑기: 더미에서 1장을 뽑아 같은 월과 매칭</li>
              <li>매칭 성공 → 카드를 먹음 (내 먹은 패에 추가)</li>
              <li>매칭 실패 → 카드가 바닥에 남음</li>
              <li>점수가 3점 이상이면 고 or 스톱 선택!</li>
            </ol>
          </Section>

          <Section title="매칭 규칙">
            <div className="space-y-1">
              <Rule name="쪽" desc="바닥에 같은 월 1장 → 둘 다 먹기" />
              <Rule name="따닥" desc="바닥에 같은 월 3장 → 4장 모두 먹기 + 피 패널티" />
              <Rule name="폭탄" desc="손패에 같은 월 3장 + 바닥에 1장 → 즉시 먹기 + 피 패널티" />
              <Rule name="쓸" desc="바닥 카드를 모두 가져감 → 피 패널티" />
              <Rule name="뻑" desc="바닥에 같은 월 3장 쌓임 → 4번째 카드로만 먹을 수 있음" />
            </div>
          </Section>

          <Section title="족보 (점수)">
            <h4 className="text-xs text-gold mt-2 mb-1">광</h4>
            <div className="space-y-0.5 text-xs">
              <p>오광 (5장): 15점 | 사광: 4점 | 삼광: 3점 | 비삼광: 2점</p>
            </div>

            <h4 className="text-xs text-gold mt-2 mb-1">띠</h4>
            <div className="space-y-0.5 text-xs">
              <p>홍단 (1,2,3월): 3점 | 청단 (6,9,10월): 3점 | 초단 (4,5,7월): 3점</p>
              <p>띠 5장 이상: 1점 + 추가 장당 1점</p>
            </div>

            <h4 className="text-xs text-gold mt-2 mb-1">열끗</h4>
            <div className="space-y-0.5 text-xs">
              <p>고도리 (2,4,8월 열끗): 5점</p>
              <p>열끗 5장 이상: 1점 + 추가 장당 1점</p>
            </div>

            <h4 className="text-xs text-gold mt-2 mb-1">피</h4>
            <div className="space-y-0.5 text-xs">
              <p>피 10장 이상: 1점 + 추가 장당 1점 (쌍피는 2장)</p>
            </div>
          </Section>

          <Section title="고 / 스톱">
            <p>점수가 3점 이상이면 고 or 스톱을 선택합니다.</p>
            <div className="space-y-1 mt-2">
              <Rule name="스톱" desc="현재 점수로 게임 종료. 안전하게 점수 획득!" />
              <Rule name="고" desc="계속 플레이. 배수가 2배씩 증가! (1고=×2, 2고=×4...)" />
            </div>
            <p className="text-xs text-action-danger mt-2">
              고를 선언했는데 상대가 먼저 스톱하면 배수가 벌칙으로 적용됩니다!
            </p>
          </Section>

          <Section title="벌칙">
            <div className="space-y-1">
              <Rule name="광박" desc="광을 하나도 못 모으면 상대 점수 ×2" />
              <Rule name="피박" desc="피가 7장 이하면 상대 점수 ×2" />
              <Rule name="고박" desc="고를 선언했는데 지면 상대 점수 ×2" />
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-bold text-text-primary mb-2">{title}</h3>
      <div className="pl-1">{children}</div>
    </div>
  );
}

function CardType({ emoji, name, desc }: { emoji: string; name: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span>{emoji}</span>
      <div>
        <span className="text-xs font-semibold text-text-primary">{name}</span>
        <span className="text-xs text-text-muted ml-1">— {desc}</span>
      </div>
    </div>
  );
}

function Rule({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="text-xs">
      <span className="font-semibold text-gold">{name}</span>
      <span className="text-text-muted ml-1">— {desc}</span>
    </div>
  );
}
