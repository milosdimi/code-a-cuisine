import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrap">
      <div class="spinner">
        <div class="spinner__ring"></div>
        <div class="spinner__icon">🍳</div>
      </div>
      @if (label) {
        <p class="spinner-label">{{ label }}</p>
      }
    </div>
  `,
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  @Input() label = '';
}
