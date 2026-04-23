import { Activity, LogOut, Upload } from 'lucide-react';
import type { AuthUser } from '../api/authApi';
import { AvatarCircle } from './ProfileModal';

interface HeaderProps {
  onUpload: () => void;
  isLoggedIn: boolean;
  user: AuthUser | null;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

export default function Header({
  onUpload,
  isLoggedIn,
  user,
  onLoginClick,
  onSignupClick,
  onProfileClick,
  onLogout,
}: HeaderProps) {
  const now = new Date();
  const dateStrYear = `${now.getFullYear()}년 `;
  const dateStr = `${now.getMonth() + 1}월 ${now.getDate()}일`;
  const dayName = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][
    now.getDay()
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground hidden sm:block ">
              러닝 대시보드
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              <span className="hidden md:inline-block">{dateStrYear}</span> {dateStr}
            </p>
            <p className="text-xs text-muted-foreground">{dayName}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={isLoggedIn ? onUpload : onLoginClick}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity ${
                isLoggedIn
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-pointer hover:bg-accent'
              }`}
            >
              <Upload size={15} />
              <span className="hidden sm:inline">업로드</span>
            </button>

            {isLoggedIn && user ? (
              <>
                <button
                  onClick={onProfileClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <AvatarCircle id={user.profileImageId} size="sm" />
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {user.nickname}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:block">로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
                >
                  로그인
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
