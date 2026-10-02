import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'Nivas360';
  private currentUrl = '';

  constructor(
    private router: Router,
    private location: Location
  ) {}

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
