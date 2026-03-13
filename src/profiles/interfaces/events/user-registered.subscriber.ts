import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { INVESTOR_COMMAND_SERVICE } from '../../domain/services/investor-command.service';
import { COMPANY_COMMAND_SERVICE } from '../../domain/services/company-command.service';
import type { IInvestorCommandService } from '../../domain/services/investor-command.service';
import type { ICompanyCommandService } from '../../domain/services/company-command.service';
import { CreateInvestorCommand } from '../../domain/model/commands/create-investor.command';
import { CreateCompanyCommand } from '../../domain/model/commands/create-company.command';

@Controller()
export class UserRegisteredSubscriber {
  constructor(
    // Inyectamos usando tus tokens (constantes)
    @Inject(INVESTOR_COMMAND_SERVICE)
    private readonly investorCommandService: IInvestorCommandService,

    @Inject(COMPANY_COMMAND_SERVICE)
    private readonly companyCommandService: ICompanyCommandService,
  ) {}

  @EventPattern('vankoo.iam.events') // El tópico exacto que vimos en Kafka UI
  async handleUserRegisteredEvent(@Payload() message: any) {
    // NestJS a veces envuelve el JSON de Kafka dentro de un atributo "value".
    // Esto asegura que extraigamos los datos sin importar cómo lleguen.
    const payload = message.value || message;

    console.log('\n=========================================');
    console.log('📥 [Kafka] ¡NUEVO EVENTO RECIBIDO DESDE IAM!');
    console.log('=========================================');

    const { id, email, roles } = payload;

    try {
      if (roles.includes('ROLE_INVESTOR')) {
        console.log(`🚀 PREPARANDO CASCARÓN DE INVERSOR:`);
        console.log(`   -> ID: ${id}`);
        console.log(`   -> Email: ${email}`);

        // Creamos el comando y lo enviamos al handler
        const command = new CreateInvestorCommand(id, email);
        await this.investorCommandService.handleCreateInvestor(command);
      } else if (roles.includes('ROLE_MYPE')) {
        console.log(`🏢 PREPARANDO CASCARÓN DE EMPRESA (MYPE):`);
        console.log(`   -> ID: ${id}`);
        console.log(`   -> Email: ${email}`);

        const command = new CreateCompanyCommand(id, email);
        await this.companyCommandService.handleCreateCompany(command);
      } else {
        console.warn(`⚠️ Rol ignorado por este microservicio: ${roles}`);
      }
    } catch (error) {
      console.error(`❌ Error procesando el evento: ${error.message}`);
    }
    console.log('=========================================\n');
  }
}
