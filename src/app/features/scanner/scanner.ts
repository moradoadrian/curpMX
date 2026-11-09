import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scanner',
  imports: [],
  templateUrl: './scanner.html',
  styleUrl: './scanner.css',
})
export class Scanner {
  private readonly router = inject(Router);

  goBack(): void {
    this.router.navigate(['/']);
  }
}

