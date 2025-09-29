#!/usr/bin/env python3
"""
modifica_csv_sovrascrivi_dragdrop_multifile.py

Script aggiornato per:
- trascinare uno o più file CSV da modificare sullo script (input tramite argomenti linea di comando)
- mettere "lotto" nella colonna B riga 1
- mettere il numero scelto dall'utente nella colonna B dalla riga 2 fino all'ultima riga compilata
- sovrascrivere direttamente i file originali
- mantiene la finestra aperta dopo l'esecuzione per vedere eventuali messaggi
"""

import csv
import os
import sys

def detect_delimiter_and_encoding(filename):
    for enc in ("utf-8", "latin1"):
        try:
            with open(filename, "r", encoding=enc, newline="") as f:
                sample = f.read(8192)
            if not sample:
                return ",", enc
            try:
                dialect = csv.Sniffer().sniff(sample, delimiters=";,	|")
                delim = dialect.delimiter
            except Exception:
                delim = ","
            return delim, enc
        except UnicodeDecodeError:
            continue
    return ",", "latin1"


def process_file(input_file, numero, data):
    delimiter, encoding = detect_delimiter_and_encoding(input_file)

    with open(input_file, "r", encoding=encoding, newline="") as f:
        reader = csv.reader(f, delimiter=delimiter)
        rows = list(reader)

    if not rows:
        rows = [[""]]

    last_filled = -1
    for i, row in enumerate(rows):
        if any(cell.strip() for cell in row):
            last_filled = i
    if last_filled < 0:
        last_filled = 0

    for i in range(len(rows)):
        while len(rows[i]) < 33:
            rows[i].append("")
        if i == 0:
            rows[i][1] = "lotto"
        elif i <= last_filled:
            rows[i][1] = numero
            rows[i][32] = data

    with open(input_file, "w", encoding=encoding, newline="") as f:
        writer = csv.writer(f, delimiter=delimiter)
        writer.writerows(rows)

    delim_name = {",": "virgola (,)", ";": "punto e virgola (;)", "\t": "tab"}.get(delimiter, repr(delimiter))
    print(f"✅ File modificato e sovrascritto: {input_file} (delimiter: {delim_name}, encoding: {encoding})")


def main():
    if len(sys.argv) < 2:
        print("Trascina uno o più file CSV sullo script o passa i percorsi come argomenti.")
        input("Premi INVIO per chiudere...")
        sys.exit(1)

    numero = input("Inserisci il numero da mettere nella colonna B (dalla riga 2 in poi): ").strip()

    data = input("Inserisci la data di consegna: ").strip()

    for input_file in sys.argv[1:]:
        if os.path.isfile(input_file):
            process_file(input_file, numero, data)
        else:
            print(f"⚠️ File non trovato: {input_file}")

    input("Tutti i file processati. Premi INVIO per chiudere...")


if __name__ == "__main__":
    main()
