import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthService } from '../../../core/services/auth.service';
import { getDashboardForRole } from '../../../core/guards/guest.guard';
import { AnimatedLogoComponent } from '../../../shared/components/animated-logo/animated-logo.component';

@Component({
  selector: 'app-brand-intro',
  standalone: true,
  imports: [CommonModule, RouterLink, AnimatedLogoComponent],
  templateUrl: './brand-intro.component.html',
  styleUrl: './brand-intro.component.css',
})
export class BrandIntroComponent implements OnInit, OnDestroy {
  public static hasPlayedThisLaunch = false;
  public isCompleted = false;
  public prefersReducedMotion = false;
  private introTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 1. If an active session already exists, route straight to dashboard
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.router.navigate([getDashboardForRole(currentUser.role)], { replaceUrl: true });
      return;
    }

    // 2. Hide native Android splash screen as web content is mounted
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
    }

    // 3. Respect user motion preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // 4. Check once-per-launch state
    let sessionPlayed = false;
    try {
      sessionPlayed = sessionStorage.getItem('grih360_intro_played') === '1';
    } catch (_) {}

    if (sessionPlayed || BrandIntroComponent.hasPlayedThisLaunch || this.prefersReducedMotion) {
      this.isCompleted = true;
    } else {
      // 1.9s total choreographed entrance (ease-out only)
      this.introTimer = setTimeout(() => {
        this.completeIntro();
      }, 1900);
    }
  }

  ngOnDestroy(): void {
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
  }

  public onSkip(): void {
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
    this.completeIntro();
  }

  private completeIntro(): void {
    this.isCompleted = true;
    BrandIntroComponent.hasPlayedThisLaunch = true;
    try {
      sessionStorage.setItem('grih360_intro_played', '1');
    } catch (_) {}
  }
}
