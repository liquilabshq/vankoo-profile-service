// src/profiles/domain/model/aggregates/profile.aggregate.ts
/**
 * @author FloweyTech
 */
export class ProfileAggregate {
  private id: string;
  private username?: string;
  private email?: string;
  private dniUrl?: string;
  private rucUrl?: string;
  private photoUrl?: string;

  constructor(id: string) {
    this.id = id;
  }

  public getId(): string {
    return this.id;
  }

  // Getters
  public getDniUrl(): string | undefined {
    return this.dniUrl;
  }
  public getRucUrl(): string | undefined {
    return this.rucUrl;
  }
  public getPhotoUrl(): string | undefined {
    return this.photoUrl;
  }
  public getUsername(): string | undefined {
    return this.username;
  }
  public getEmail(): string | undefined {
    return this.email;
  }

  // Setters de negocio (Comandos)
  public updateDni(dniUrl: string): void {
    this.dniUrl = dniUrl;
  }
  public updateRuc(rucUrl: string): void {
    this.rucUrl = rucUrl;
  }
  public updatePhoto(photoUrl: string): void {
    this.photoUrl = photoUrl;
  }

  // Esto se usaría cuando Kafka envíe el evento de creación
  public initializeBasicData(username: string, email: string): void {
    this.username = username;
    this.email = email;
  }
}
