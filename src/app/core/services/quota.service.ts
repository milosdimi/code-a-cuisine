import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuotaStatus {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  message?: string;
}

const QUOTA_MESSAGES = {
  IP_EXCEEDED:    'Du hast heute bereits 3 Rezepte generiert. Morgen kannst du wieder 3 neue Rezepte entdecken!',
  SYSTEM_LIMIT:   'Der Tages-Limit der App ist erreicht. Bitte versuche es morgen wieder.',
  SHARED_NETWORK: 'Das Tageslimit für dein Netzwerk wurde erreicht. Bitte versuche es morgen wieder.'
} as const;

/**
 * Checks per-IP and system-wide daily generation quotas via Firebase Realtime DB.
 * Quota counters are stored at /quota/{DATE}/{IP_HASH} and /quota/{DATE}/total.
 */
@Injectable({ providedIn: 'root' })
export class QuotaService {
  private readonly MAX_PER_IP = 3;
  private readonly MAX_SYSTEM = 12;
  private readonly DB_URL = environment.firebase.databaseURL;

  constructor(private http: HttpClient) {}

  /**
   * Checks whether the current user is allowed to generate another recipe set.
   * Falls back to `allowed: true` when the quota endpoint is unreachable so the
   * n8n workflow can perform its own authoritative check.
   * @returns Observable emitting a QuotaStatus object.
   */
  checkQuota(): Observable<QuotaStatus> {
    const today = this.todayKey();
    const resetTime = this.midnight();

    return this.http
      .get<Record<string, number>>(`${this.DB_URL}/quota/${today}.json`)
      .pipe(
        map(data => {
          if (!data) return this.buildStatus(0, 0, resetTime);
          const total = data['total'] ?? 0;
          const ipCount = data[this.ipKey()] ?? 0;

          if (ipCount >= this.MAX_PER_IP) {
            return { allowed: false, remaining: 0, resetTime, message: QUOTA_MESSAGES.IP_EXCEEDED };
          }
          if (total >= this.MAX_SYSTEM) {
            return { allowed: false, remaining: 0, resetTime, message: QUOTA_MESSAGES.SYSTEM_LIMIT };
          }
          return this.buildStatus(ipCount, total, resetTime);
        }),
        catchError(() => of(this.buildStatus(0, 0, resetTime)))
      );
  }

  private buildStatus(ipCount: number, total: number, resetTime: Date): QuotaStatus {
    const remaining = Math.min(this.MAX_PER_IP - ipCount, this.MAX_SYSTEM - total);
    return { allowed: true, remaining, resetTime };
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Hashed placeholder – real hashing happens in n8n for privacy. */
  private ipKey(): string {
    return 'client';
  }

  private midnight(): Date {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d;
  }
}
