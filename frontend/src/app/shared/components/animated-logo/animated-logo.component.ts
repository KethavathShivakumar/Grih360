import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="animated-logo-container"
      [style.width.px]="size"
      [style.height.px]="size"
      [class.completed]="isCompleted"
      [class.reduced-motion]="prefersReducedMotion"
    >
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 88 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full block"
        aria-hidden="true"
      >
        <!-- House outline drawn as a single continuous vector -->
        <path
          d="M 16 38 L 44 14 L 72 38 L 66 38 L 66 72 L 22 72 L 22 38 Z"
          class="logo-house-path"
          pathLength="100"
          stroke="var(--brand)"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />

        <!-- Centered Grih360 geometric G mark inside the house -->
        <path
          d="M 52 49 H 44 V 55 H 48.5 C 47.8 58 45.2 60 42 60 C 37.6 60 34 56.4 34 52 C 34 47.6 37.6 44 42 44 C 44.8 44 47.2 45.5 48.4 47.7 L 53.2 44.8 C 50.8 40.8 46.7 38 42 38 C 34.3 38 28 44.3 28 52 C 28 59.7 34.3 66 42 66 C 48.6 66 54 61.2 54.8 54.8 C 54.9 54 55 53 55 52 V 49 H 52 Z"
          class="logo-g-mark"
          fill="var(--n-0)"
        />
      </svg>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .animated-logo-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 1. House stroke draw: 0ms to 850ms */
    .logo-house-path {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: drawHouse var(--dur-intro-draw) var(--ease) forwards;
    }

    /* 2. G mark inside: fades in and settles 800ms to 1100ms */
    .logo-g-mark {
      opacity: 0;
      transform: translateY(3px);
      animation: fadeInSettle var(--dur-intro-settle) var(--ease) 800ms forwards;
    }

    /* Completed state (when animation finished or skip clicked) */
    .animated-logo-container.completed .logo-house-path {
      stroke-dashoffset: 0;
      animation: none;
    }

    .animated-logo-container.completed .logo-g-mark {
      opacity: 1;
      transform: translateY(0);
      animation: none;
    }

    /* Keyframes (ease-out only, no bounce, no float, no loop) */
    @keyframes drawHouse {
      from {
        stroke-dashoffset: 100;
      }
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes fadeInSettle {
      from {
        opacity: 0;
        transform: translateY(3px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Reduced motion override */
    @media (prefers-reduced-motion: reduce) {
      .logo-house-path {
        stroke-dashoffset: 0 !important;
        animation: none !important;
      }
      .logo-g-mark {
        opacity: 1 !important;
        transform: none !important;
        animation: none !important;
      }
    }

    .animated-logo-container.reduced-motion .logo-house-path {
      stroke-dashoffset: 0 !important;
      animation: none !important;
    }

    .animated-logo-container.reduced-motion .logo-g-mark {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
  `]
})
export class AnimatedLogoComponent {
  @Input() size: number = 88;
  @Input() isCompleted: boolean = false;
  @Input() prefersReducedMotion: boolean = false;
}
