/**
 *
 * Copyright 2024 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * SQL Database support using SQLITE3.
 * 
 * What's supported is SQLITE3ORM - a lightweight
 * ORM that runs on top of SQLITE3.
 */

import { SqlDatabase } from 'sqlite3orm';

export const sqdb = new SqlDatabase();;
await sqdb.open(':memory:');
