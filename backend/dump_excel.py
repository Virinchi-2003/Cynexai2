import pandas as pd
import sys

def main():
    try:
        xl = pd.ExcelFile('../Modules Data.xlsx')
        print("Sheets in excel file:", xl.sheet_names)
        for name in xl.sheet_names:
            df = xl.parse(name)
            print(f"\n--- SHEET: {name} ---")
            print(df.head(20))
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
