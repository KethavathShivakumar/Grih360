import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Location, AsyncPipe, NgIf } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthService } from './core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'Grih360';
  private currentUrl = '';
  public isInitialized$: Observable<boolean>;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService
  ) {
    this.isInitialized$ = this.authService.isInitialized$;
  }

  ngOnInit(): void {
    if (Capacitor.isNativePlatform()) {
      this.initCapacitor();
    }
  }

  private async initCapacitor(): Promise<void> {
    // 1. Status Bar Setup: Dark icons/text, brand background, no webview overlap
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0F2937' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (e) {
      console.warn('StatusBar initialization warning:', e);
    }

    // Track current route URL
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.urlAfterRedirects || event.url;
      }
    });

    // 2. Android Hardware Back Button Handler via @capacitor/app
    CapApp.addListener('backButton', ({ canGoBack }) => {
      const rootRoutes = [
        '/',
        '/role-selection',
        '/tenant/dashboard',
        '/owner/dashboard',
        '/professional/dashboard',
        '/admin/dashboard',
        '/auth/login'
      ];

      const cleanPath = this.currentUrl.split('?')[0].split('#')[0];
      const isRoot = rootRoutes.includes(cleanPath);

      if (isRoot || !canGoBack) {
        CapApp.exitApp();
      } else {
        this.location.back();
      }
    });
  }
}
