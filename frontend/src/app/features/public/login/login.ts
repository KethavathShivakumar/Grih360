import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding: 2rem; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
      <h2>Grih360 — Authentication (Login Placeholder)</h2>
      <p style="color: #64748b;">Phase 0 routing verification placeholder page.</p>
      <p><a routerLink="/" style="color: #2563eb;">← Back to Home</a></p>
    </div>
  `
})
export class LoginComponent {}
