'''

Script to parse events first defined in Rust Server code into TypeScript for Front End Usage  

'''

from pathlib import Path

ROOT_DEPTH = 2  # relies on being in directory /shared/scripts
ROOT_DIR = str(Path(__file__).resolve().parents[ROOT_DEPTH]).replace('\\', '/')

EVENT_TYPES_RUST_PATH = ROOT_DIR + '/server/src/shared_types.rs'
EVENT_TYPES_TYPESCRIPT_PATH = ROOT_DIR + '/frontend/src/utils/shared-types.ts'


def convert_rust_syntax_to_ts(rust_string: str):
    type_def_replacements = [
        ('pub struct', 'export type'),
        ('pub type', 'export type'),
        ('{', '= {')
    ]
    enum_replacements = [
        ('pub enum', 'export enum'),
    ]
    pub_replacements = [
        ('pub', ''),
    ]
    option_replacements = [
        (': Option<', '?: '),
        ('>,', ','),
    ]
    style_replacements = [
        ('String', 'string'),
        ('Vec', 'Array'),
        ('u8', 'number'),
        ('usize', 'number'),
        ('HashSet', 'Array'),
        ('HashMap', 'Record'),
        (';', ''),
    ]

    ts_string = rust_string

    # Struct vs Enum vs Field definition
    if 'struct' in ts_string or 'type' in ts_string:
        for (old, new) in type_def_replacements:
            ts_string = ts_string.replace(old, new)
    elif 'enum' in ts_string:
        for (old, new) in enum_replacements:
            ts_string = ts_string.replace(old, new)
    else:
        for (old, new) in pub_replacements:
            ts_string = ts_string.replace(old, new)

    # Nullable Fields
    if option_replacements[0][0] in ts_string:
        for (old, new) in option_replacements:
            ts_string = ts_string.replace(old, new)

    # Type differences and semicolons
    for (old, new) in style_replacements:
        ts_string = ts_string.replace(old, new)

    return ts_string


def parse_rust_to_ts():  # Parse into TypeScript module
    with open(EVENT_TYPES_RUST_PATH, 'r') as rust_f:
        lines = []
        for line in [x for x in rust_f.readlines() if not x.startswith(('#', 'use'))]:  # ignore annotations
            lines.append(convert_rust_syntax_to_ts(line))

        print('Preparing to write:\n_______________________')
        [print(x, end='') for x in lines]
        print(f'_______________________\n\nto {EVENT_TYPES_TYPESCRIPT_PATH}\n')
        if input('confirm? [y\\n]: ') == 'y':
            with open(EVENT_TYPES_TYPESCRIPT_PATH, 'w', newline='\n') as ts_f:
                ts_f.writelines(lines)
            print('Completed Write.')
        else:
            print('Skipped Write.')


if __name__ == "__main__":
    parse_rust_to_ts()
