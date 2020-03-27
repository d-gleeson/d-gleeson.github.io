"""
Scrape number of tests per day
"""

from datetime import datetime
import re

import bs4
import pandas as pd
import requests

uk_url = r"https://www.gov.uk/guidance/coronavirus-covid-19-information-for-the-public"
uk_site = requests.get(uk_url)

df = pd.read_csv('records.csv', index_col=0)

uk_soup = bs4.BeautifulSoup(uk_site.text)
p = next(p for p in uk_soup.select('p') if p.text.startswith("As of"))

date_regex = re.compile(r'(\d+\s.*\s2020), a total of')
tested_regex = re.compile(r'a total of\s(.*)\speople have been tested')
negative_regex = re.compile(r'of which\s(.*)\swere confirmed negative')
positive_regex = re.compile(r'negative and\s(.*)\swere confirmed positive')

date = datetime.strptime(date_regex.search(p.text).groups()[0], '%d %B %Y')
tested = int(tested_regex.search(p.text).groups()[0].replace(",", ""))
negative = int(negative_regex.search(p.text).groups()[0].replace(",", ""))
positive = int(positive_regex.search(p.text).groups()[0].replace(",", ""))

record = {'Date' : date,
 'Country': 'UK',
 'Tested' : tested,
 'Positive' : positive,
 'Negative' : negative}

record = pd.DataFrame(record, index=[0])
df = pd.concat([df, record], ignore_index=True, sort=False)
df.to_csv('records.csv')

