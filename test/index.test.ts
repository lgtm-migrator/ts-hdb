import { HDBClient } from "../src";
import { get_db_options, random_table_name } from "./utils";

describe("Basic Test Suite", () => {

  it("should support connect to database and query dummy", async () => {
    
    expect(get_db_options().host).not.toBeUndefined();
    const client = new HDBClient(get_db_options());
    try {
      const rows = await client.query<{LABEL_ONE: number}>("SELECT 1 AS LABEL_ONE FROM DUMMY");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveProperty("LABEL_ONE");
      expect(rows[0].LABEL_ONE).toBe(1);
  
      expect(client.readyState).toBe("connected");
      expect(typeof client.clientId).toBe("string");
    } finally {
      await client.disconnect();    
      client.close();
    }

  });

  it("should support create statement and query with parameter", async () => {
    const client = new HDBClient(get_db_options());
    const table_name = random_table_name();
    const response =  await client.exec(`CREATE COLUMN TABLE ${table_name} (
      ID bigint NOT NULL, 
      NAME nvarchar(255)
    )`);

  

    try {
      interface T {
        ID: number,
        NAME: string,
      }
      expect(response).toBeUndefined();
      const stat = await client.prepare<T>(`INSERT INTO ${table_name} VALUES (?,?)`);
      expect(stat).not.toBeUndefined();
      expect(stat.id).not.toBeUndefined();
      const affectedRows = await stat.write([1, "Theo"], [2, "Neo"]);
      expect(affectedRows).toStrictEqual([1, 1]);

      await stat.drop();

      const [{ TOTAL }] = await client.exec(`SELECT COUNT(1) AS TOTAL FROM ${table_name}`);
      expect(TOTAL).toBe(2);

      const query_stat = await client.prepare<T, [number]>(`SELECT ID, NAME FROM ${table_name} WHERE ID = ?`);
      expect(query_stat).not.toBeUndefined();
      const result_set = await query_stat.query(1);
      expect(result_set).toHaveLength(1);
      expect(result_set[0].NAME).toBe("Theo");

      const query_rs =  await  query_stat.execute(2);
      expect(query_rs).not.toBeUndefined();
      for await (const row of query_rs.createObjectStream()) {
        expect(row.ID).not.toBeUndefined();
        expect(row.NAME).not.toBeUndefined();
      }
      query_rs.close();

      await query_stat.drop();
    } finally {
      await client.exec(`DROP TABLE ${table_name}`);
      await client.disconnect();    
      client.close();
    }

  });

  it("should support read as stream", async () => {
    
    const client = new HDBClient(get_db_options());
    const table_name = random_table_name();
    const response =  await client.exec(`CREATE COLUMN TABLE ${table_name} (
      ID bigint NOT NULL, 
      NAME nvarchar(255)
    )`);
    
    try {

      expect(response).toBeUndefined();
      const stat = await client.prepare(`INSERT INTO ${table_name} VALUES (?,?)`);
      expect(stat).not.toBeUndefined();
      expect(stat.id).not.toBeUndefined();
      const affectedRows = await stat.write([1, "Theo"], [2, "Neo"], [3, "Nano"], [4, "Jobs"]);
      expect(affectedRows).toStrictEqual([1, 1, 1, 1]);

      const rs = await client.execute<{ID: string, NAME: string}>(`SELECT ID, NAME FROM ${table_name}`);
      rs.setFetchSize(1);
      expect(rs).not.toBeUndefined();
      
      let total = 0;
      for await (const chunk of rs.createObjectStream()) {
        total++;
        expect(chunk.ID).not.toBeUndefined(); 
        expect(chunk.NAME).not.toBeUndefined(); 
      }

      expect(total).toBe(4);

      rs.close();

    } finally {
      await client.exec(`DROP TABLE ${table_name}`);
      await client.disconnect();    
      client.close();
    }
  });
 
});
