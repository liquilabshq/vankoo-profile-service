// Importaciones normales (código real)
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IProfileCommandService } from '../../../domain/services/profile-command.service';
import { UploadDniCommand } from '../../../domain/model/commands/upload-dni.command';
import { UploadPhotoCommand } from '../../../domain/model/commands/upload-photo.command';
import { UploadRucCommand } from '../../../domain/model/commands/upload-ruc.command';
import { ProfileAggregate } from '../../../domain/model/aggregates/profile.aggregate';
import { PROFILE_REPOSITORY } from '../../../domain/repositories/profile.repository';

// Importación EXCLUSIVA de tipos (Nota el "import type")
import type { IProfileRepository } from '../../../domain/repositories/profile.repository';

/**
 * @author FloweyTech
 * @summary Implementación de los casos de uso (comandos) limpios para Perfiles.
 */
@Injectable()
export class ProfileCommandServiceImpl implements IProfileCommandService {
  constructor(
    // Inyectamos el contrato, NO la tecnología
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: IProfileRepository,
  ) {}

  async handleUploadDni(command: UploadDniCommand): Promise<ProfileAggregate> {
    const profile = await this.profileRepository.findById(command.profileId);
    if (!profile)
      throw new NotFoundException(
        `Perfil con ID ${command.profileId} no encontrado en Vankoo.`,
      );

    profile.updateDni(command.dniDocumentUrl);
    await this.profileRepository.save(profile);

    return profile;
  }

  async handleUploadRuc(command: UploadRucCommand): Promise<ProfileAggregate> {
    const profile = await this.profileRepository.findById(command.profileId);
    if (!profile) throw new NotFoundException(`Perfil no encontrado.`);

    profile.updateRuc(command.rucDocumentUrl);
    await this.profileRepository.save(profile);

    return profile;
  }

  async handleUploadPhoto(
    command: UploadPhotoCommand,
  ): Promise<ProfileAggregate> {
    const profile = await this.profileRepository.findById(command.profileId);
    if (!profile) throw new NotFoundException(`Perfil no encontrado.`);

    profile.updatePhoto(command.photoUrl);
    await this.profileRepository.save(profile);

    return profile;
  }
}
