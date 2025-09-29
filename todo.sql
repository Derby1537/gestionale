ALTER TABLE `vetri_ordinati` ADD `lotto` INT AFTER `riferimento`;

ALTER TABLE `vetri_ordinati` ADD FOREIGN KEY (`lotto`) REFERENCES `lotto`(`numero_lotto`) ON DELETE RESTRICT ON UPDATE RESTRICT;
