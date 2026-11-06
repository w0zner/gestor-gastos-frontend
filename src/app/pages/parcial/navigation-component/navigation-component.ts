import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navigation-component',
  imports: [
    RouterLink,
    NgIf,
    AsyncPipe
  ],
  templateUrl: './navigation-component.html',
  styleUrl: './navigation-component.css',
})
export class NavigationComponent {
  private router = inject(Router);
  private auth = inject(Auth);

  usuario$ = user(this.auth);

  cerrarSesion() {
    try {
      this.auth.signOut().then((result) => {
        this.router.navigateByUrl('/auth');
      });
    } catch (error) {
      console.error('Error al cerrar sesión' + error);
    }
  }
}
