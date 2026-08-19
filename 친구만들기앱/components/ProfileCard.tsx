export type ProfileCardProps = {
  id: string;
  avatarUrl: string | null;
  nickname: string;
  age: number;
  department: string;
  tags: string[];
  bio: string;
};

// TODO: B의 components/Avatar.tsx 나오면 교체 (Phase 2-3)
function TempAvatar({ avatarUrl, nickname }: { avatarUrl: string | null; nickname: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={nickname} className="profile-card__avatar" />;
  }
  return (
    <div className="profile-card__avatar profile-card__avatar--fallback" data-testid="avatar-fallback">
      {nickname.charAt(0)}
    </div>
  );
}

// TODO: B의 components/TagChip.tsx 나오면 교체 (Phase 2-3)
function TempTagChip({ label }: { label: string }) {
  return <span className="profile-card__tag">{label}</span>;
}

export function ProfileCard({ id, avatarUrl, nickname, age, department, tags, bio }: ProfileCardProps) {
  return (
    <a href={`/profile/${id}`} className="profile-card">
      <TempAvatar avatarUrl={avatarUrl} nickname={nickname} />
      <div className="profile-card__nickname">{nickname}</div>
      <div className="profile-card__meta">
        {age}세 · {department}
      </div>
      <div className="profile-card__tags">
        {tags.map((tag) => (
          <TempTagChip key={tag} label={tag} />
        ))}
      </div>
      <div className="profile-card__bio">{bio}</div>
    </a>
  );
}
