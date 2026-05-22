import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookingStyle } from '../../../core/models/recipe.model';

export interface FilterOption {
  value: CookingStyle | 'all';
  label: string;
}

@Component({
  selector: 'app-cuisine-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cuisine-filter.component.html',
  styleUrl: './cuisine-filter.component.scss'
})
export class CuisineFilterComponent {
  @Input() active: CookingStyle | 'all' = 'all';
  @Output() filterChange = new EventEmitter<CookingStyle | 'all'>();

  readonly filters: FilterOption[] = [
    { value: 'all',      label: 'Alle'             },
    { value: 'german',   label: 'Deutsch'          },
    { value: 'italian',  label: 'Italienisch'      },
    { value: 'japanese', label: 'Japanisch'        },
    { value: 'indian',   label: 'Indisch'          },
    { value: 'gourmet',  label: 'Gourmet'          },
    { value: 'fusion',   label: 'Fusion'           }
  ];

  select(value: CookingStyle | 'all'): void {
    this.filterChange.emit(value);
  }
}
