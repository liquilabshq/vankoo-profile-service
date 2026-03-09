/* import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices'; */
// Aquí importarías tu Command Service en el futuro

/**
 * @author LiquiLabs
 * @summary Escucha eventos provenientes del broker de Kafka (Ej. IAM).
 */
/*
@Controller()
export class UserRegisteredSubscriber {
  constructor() {
    // private readonly profileCommandService: IProfileCommandService,
  }

  @EventPattern('user.registered') // El nombre del tópico en Kafka
  async handleUserRegisteredEvent(@Payload() message: any) {
    console.log('¡Evento recibido desde IAM!', message);

    // Aquí el payload traerá el UUID que generó IAM
    const { id, email, username } = message;

    // TODO: Construir el CreateProfileCommand y enviarlo al Command Service
    // const command = new CreateProfileCommand(id, email, username);
    // await this.profileCommandService.handleCreateProfile(command);
  }
}
*/
