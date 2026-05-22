import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates a string to the given character limit and appends an ellipsis.
 * Usage: {{ text | truncate:80 }}
 */
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 100, suffix = '…'): string {
    if (!value || value.length <= limit) return value;
    return value.slice(0, limit).trimEnd() + suffix;
  }
}
