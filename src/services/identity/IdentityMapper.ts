import { memberRepository } from '@/db/repositories/MemberRepository';
import { workerRepository } from '@/db/repositories/WorkerRepository';
import type { Member } from '@/db/models/Member';

/** 매핑되지 않은 JIRA 작업자 정보 */
export interface UnmappedWorker {
  accountId: string;
  displayName: string;
  email?: string;
}

/** 통합 작업자 정보 (미매핑 + 제외 포함) */
export interface UnmappedWorkerWithStatus extends UnmappedWorker {
  excluded: boolean;
}

export class IdentityMapper {
  /**
   * JIRA 동기화 후, workers 테이블의 모든 작업자를 members 테이블과 대조한다.
   * - jiraAccountId 또는 email로 매칭 시도
   * - 매칭되지 않은 작업자 목록을 반환 (매핑 대기열)
   */
  async findUnmappedWorkers(): Promise<UnmappedWorker[]> {
    const workers = await workerRepository.getAll();
    const members = await memberRepository.getAll();

    const byAccountId = new Map<string, Member>();
    const byEmail = new Map<string, Member>();
    for (const member of members) {
      if (member.jiraAccountId) byAccountId.set(member.jiraAccountId, member);
      if (member.email) byEmail.set(member.email.toLowerCase(), member);
    }

    const unmapped: UnmappedWorker[] = [];

    for (const worker of workers) {
      if (worker.excluded) continue;

      const matchByAccountId = byAccountId.has(worker.accountId);
      const matchByEmail = worker.email && byEmail.has(worker.email.toLowerCase());

      if (!matchByAccountId && !matchByEmail) {
        unmapped.push({
          accountId: worker.accountId,
          displayName: worker.displayName,
          email: worker.email,
        });
      }
    }

    return unmapped;
  }

  /** 미매핑 + 제외 작업자를 하나의 통합 리스트로 반환한다. */
  async findAllUnmappedOrExcludedWorkers(): Promise<UnmappedWorkerWithStatus[]> {
    const workers = await workerRepository.getAll();
    const members = await memberRepository.getAll();

    const byAccountId = new Map<string, Member>();
    const byEmail = new Map<string, Member>();
    for (const member of members) {
      if (member.jiraAccountId) byAccountId.set(member.jiraAccountId, member);
      if (member.email) byEmail.set(member.email.toLowerCase(), member);
    }

    const result: UnmappedWorkerWithStatus[] = [];

    for (const worker of workers) {
      if (worker.excluded) {
        result.push({
          accountId: worker.accountId,
          displayName: worker.displayName,
          email: worker.email,
          excluded: true,
        });
        continue;
      }

      const matchByAccountId = byAccountId.has(worker.accountId);
      const matchByEmail = worker.email && byEmail.has(worker.email.toLowerCase());

      if (!matchByAccountId && !matchByEmail) {
        result.push({
          accountId: worker.accountId,
          displayName: worker.displayName,
          email: worker.email,
          excluded: false,
        });
      }
    }

    return result;
  }

  /** 제외 처리된 작업자 목록을 반환한다. */
  async findExcludedWorkers(): Promise<UnmappedWorker[]> {
    const workers = await workerRepository.getAll();
    return workers
      .filter((w) => w.excluded)
      .map((w) => ({ accountId: w.accountId, displayName: w.displayName, email: w.email }));
  }

  /** 작업자를 제외 처리한다. 해당 작업자의 이슈는 모든 통계에서 제외된다. */
  async excludeWorker(accountId: string): Promise<void> {
    const worker = await workerRepository.getByKey(accountId);
    if (!worker) return;
    worker.excluded = true;
    await workerRepository.put(worker);
  }

  /** 제외 처리된 작업자를 복원한다. */
  async restoreWorker(accountId: string): Promise<void> {
    const worker = await workerRepository.getByKey(accountId);
    if (!worker) return;
    worker.excluded = false;
    await workerRepository.put(worker);
  }

  /**
   * JIRA 작업자를 기존 Member에 매핑한다.
   * Member의 jiraAccountId를 업데이트한다.
   */
  async mapWorkerToMember(workerAccountId: string, memberEmail: string): Promise<void> {
    const member = await memberRepository.getByEmail(memberEmail);
    if (!member) throw new Error(`Member not found: ${memberEmail}`);

    member.jiraAccountId = workerAccountId;
    await memberRepository.put(member);
  }

  /**
   * 미매핑 JIRA 작업자를 새 Member로 빠르게 등록한다.
   */
  async registerWorkerAsMember(
    worker: UnmappedWorker,
    nickname: string,
    teamId?: number,
  ): Promise<void> {
    const email = worker.email || `${worker.accountId}@jira.local`;
    const member: Member = {
      email,
      jiraAccountId: worker.accountId,
      nickname,
      teamId,
    };
    await memberRepository.put(member);
  }

  /**
   * JIRA accountId로 매핑된 Member를 찾는다.
   * 없으면 undefined를 반환한다.
   */
  async getMemberByJiraId(jiraAccountId: string): Promise<Member | undefined> {
    return memberRepository.getByJiraAccountId(jiraAccountId);
  }

  /**
   * 자동 매핑: JIRA 동기화 후, email이 일치하는 workers를 members에 자동 연결한다.
   * @returns 자동 매핑된 수
   */
  async autoMapByEmail(): Promise<number> {
    const workers = await workerRepository.getAll();
    const members = await memberRepository.getAll();

    const membersByEmail = new Map<string, Member>();
    for (const member of members) {
      if (member.email && !member.jiraAccountId) {
        membersByEmail.set(member.email.toLowerCase(), member);
      }
    }

    let mapped = 0;
    for (const worker of workers) {
      if (!worker.email) continue;
      const member = membersByEmail.get(worker.email.toLowerCase());
      if (member) {
        member.jiraAccountId = worker.accountId;
        await memberRepository.put(member);
        mapped++;
      }
    }

    return mapped;
  }
}

export const identityMapper = new IdentityMapper();
