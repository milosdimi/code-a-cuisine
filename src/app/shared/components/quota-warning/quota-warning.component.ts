import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quota-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quota-warning" role="alert" *ngIf="message">
      <span class="quota-warning__icon" aria-hidden="true">⚠️</span>
      <p class="quota-warning__msg">{{ message }}</p>
    </div>
  `,
  styles: [`
    .quota-warning {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: rgba(245, 124, 0, 0.1);
      border: 1px solid rgba(245, 124, 0, 0.3);
      border-radius: 8px;
      margin-bottom: 16px;

      &__icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }

      &__msg {
        font-size: 16px;
        color: #5d3c00;
        line-height: 1.5;
      }
    }
  `]
})
export class QuotaWarningComponent {
  /** The warning message to display. Component is hidden when empty. */
  @Input() message = '';
}
