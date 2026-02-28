// src/profiles/infrastructure/persistence/typeorm/entities/profile.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @author LiquiLabs
 */
@Entity('profiles')
export class ProfileEntity {
  @PrimaryColumn('uuid')
  id: string;

  // Datos que vendrán desde IAM por Kafka al momento del registro
  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  // Documentos que el usuario sube después
  @Column({ name: 'dni_url', type: 'varchar', nullable: true })
  dniUrl: string | null;

  @Column({ name: 'ruc_url', type: 'varchar', nullable: true })
  rucUrl: string | null;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}