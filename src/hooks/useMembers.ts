import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { memberRepository } from '@/db/repositories/MemberRepository';
import type { Member } from '@/db/models/Member';

export function useMembers() {
  const members = useLiveQuery(() => db.members.toArray());

  const addMember = async (member: Member): Promise<void> => {
    await memberRepository.put(member);
  };

  const updateMember = async (member: Member): Promise<void> => {
    await memberRepository.put(member);
  };

  const deleteMember = async (email: string): Promise<void> => {
    await memberRepository.delete(email);
  };

  return {
    members: members ?? [],
    isLoading: members === undefined,
    addMember,
    updateMember,
    deleteMember,
  };
}
