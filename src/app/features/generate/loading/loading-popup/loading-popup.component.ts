import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loading-popup',
  standalone: true,
  imports: [],
  templateUrl: './loading-popup.component.html',
  styleUrl: './loading-popup.component.scss'
})
export class LoadingPopupComponent {
  @Input() show = false;
  @Input() errorTitle   = 'Ups! Not quite enough...';
  @Input() errorMessage = 'It looks like some ingredient quantities aren\'t sufficient for your selected servings. Please add or adjust quantities and try again.';
  @Output() closed = new EventEmitter<void>();

  constructor(private router: Router) {}

  close(): void {
    this.closed.emit();
  }

  goBack(): void {
    this.closed.emit();
    this.router.navigate(['/cookbook']);
  }
}
