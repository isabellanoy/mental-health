import { IsBoolean } from 'class-validator';
import { ToBoolean } from '../../common/transforms.js';

export class UpdateRouletteImageDto {
  @ToBoolean()
  @IsBoolean({ message: '"active" debe ser verdadero o falso.' })
  active: boolean;
}
