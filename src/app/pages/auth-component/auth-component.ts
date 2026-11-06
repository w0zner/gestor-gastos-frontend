import { Component, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-component',
  imports: [],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})

export class AuthComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  loginConGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        console.log('Usuario logueado con éxito', result.user.email);
        console.log("Bienvenido")
        this.router.navigateByUrl("/inicio")
      })
      .catch((error) => console.error('Error al loguear', error));
  }
}
