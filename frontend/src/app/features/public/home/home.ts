import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HealthService } from '../../../core/services/health.service';
import { HealthCheckStatus } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding: 2rem; max-width: 800px; margin: 0 auto; font-family: system-ui, sans-serif;">
      <h1 style="color: #1e293b;">Nivas360 — Phase 0 Foundation</h1>
      <p style="color: #64748b; font-size: 1.1rem;">
        MEAN Stack Architecture Baseline (Angular + Express + Node.js + MongoDB)
      </p>

      <div style="margin: 2rem 0; padding: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 1.25rem; margin-top: 0; color: #334155;">API & MongoDB Connectivity Verification</h2>

        @if (loading()) {
          <p style="color: #6366f1;">Connecting to Express backend API (/api/v1/health)...</p>
        } @else if (healthStatus()) {
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
            <p style="margin: 0; color: #166534; font-weight: 600;">
              ✓ Backend Communication Successful
            </p>
            <p style="margin: 0.5rem 0 0; color: #15803d; font-size: 0.95rem;">
              Response Message: {{ healthStatus()?.message }}
            </p>
            <p style="margin: 0.25rem 0 0; color: #15803d; font-size: 0.95rem;">
              Environment: {{ healthStatus()?.environment }} | Uptime: {{ healthStatus()?.uptime }}s
            </p>
            <p style="margin: 0.25rem 0 0; color: #15803d; font-size: 0.95rem;">
              MongoDB Status: <strong>{{ healthStatus()?.mongodb?.status }}</strong>
              @if (healthStatus()?.mongodb?.name) {
                ({{ healthStatus()?.mongodb?.host }}/{{ healthStatus()?.mongodb?.name }})
              }
            </p>
          </div>
        } @else if (errorMessage()) {
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">⚠️ API Connection Issue</p>
            <p style="margin: 0.5rem 0 0; color: #b91c1c; font-size: 0.95rem;">{{ errorMessage() }}</p>
          </div>
        }

        <button
          (click)="fetchHealth()"
          style="padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Re-test API Connection
        </button>
      </div>

      <div style="margin-top: 2rem;">
        <h3 style="color: #334155;">Foundation Navigation Verification:</h3>
        <ul style="display: flex; gap: 1rem; list-style: none; padding: 0; flex-wrap: wrap;">
          <li><a routerLink="/" style="color: #2563eb;">Home</a></li>
          <li><a routerLink="/login" style="color: #2563eb;">Login</a></li>
          <li><a routerLink="/register" style="color: #2563eb;">Register</a></li>
          <li><a routerLink="/tenant" style="color: #2563eb;">Tenant Space</a></li>
          <li><a routerLink="/owner" style="color: #2563eb;">Owner Space</a></li>
          <li><a routerLink="/professional" style="color: #2563eb;">Pro Service Space</a></li>
          <li><a routerLink="/admin" style="color: #2563eb;">Admin Console</a></li>
        </ul>
      </div>

      <div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.875rem;">
        Phase 0 Architectural Foundation — UI will be provided by Stitch in Phase 1.
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  healthStatus = signal<HealthCheckStatus | null>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.fetchHealth();
  }

  fetchHealth(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.healthService.checkHealth().subscribe({
      next: (res) => {
        this.healthStatus.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Health check failed:', err);
        this.errorMessage.set('Could not connect to Nivas360 API server');
        this.loading.set(false);
      }
    });
  }
}
