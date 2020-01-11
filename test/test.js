/**
 * Unit tests for pure (functional) components.
 * @module test/test
 */

'use strict';

var assert = require('assert');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-json-schema'));

const fs = require('fs').promises;

const bits = require('../src/data/bits');
const gate = require('../src/data/gate');
const circuit = require('../src/data/circuit');
const label = require('../src/data/label');
const assignment = require('../src/data/assignment');
const channel = require('../src/comm/channel');
const garble = require('../src/garble');
const evaluate = require('../src/evaluate');

var and4_bristol = "3 7\n2 2 2\n1 1\n2 1 0 1 4 AND\n2 1 2 3 5 AND\n2 1 4 5 6 AND";
var and4_json = {
  "gate_count": 3, "wire_count": 7,
  "value_in_count": 2, "value_in_length": [2,2],
  "value_out_count": 1, "value_out_length": [1],
  "wire_in_count": 4, "wire_in_index": [1, 2, 3, 4],
  "wire_out_count": 1, "wire_out_index":[7],
  "gate": [
    {"operation": "and", "wire_in_index": [1,2], "wire_out_index":[5]},
    {"operation": "and", "wire_in_index": [3,4], "wire_out_index":[6]},
    {"operation": "and", "wire_in_index": [5,6], "wire_out_index":[7]}
  ]
};

var add32_bristol = "375 439\n2 32 32\n1 33\n2 1 0 32 406 XOR\n2 1 5 37 373 AND\n2 1 4 36 336 AND\n2 1 10 42 340 AND\n2 1 14 46 366 AND\n2 1 24 56 341 AND\n2 1 8 40 342 AND\n2 1 1 33 343 AND\n2 1 7 39 348 AND\n2 1 28 60 349 AND\n2 1 19 51 350 AND\n2 1 2 34 351 AND\n2 1 30 62 364 AND\n2 1 13 45 352 AND\n2 1 18 50 353 AND\n2 1 11 43 355 AND\n2 1 3 35 356 AND\n2 1 16 48 359 AND\n2 1 31 63 357 AND\n2 1 27 59 358 AND\n2 1 15 47 360 AND\n2 1 17 49 361 AND\n2 1 9 41 363 AND\n2 1 32 0 278 AND\n2 1 29 61 362 AND\n2 1 6 38 365 AND\n2 1 25 57 354 AND\n2 1 20 52 367 AND\n2 1 22 54 331 AND\n2 1 21 53 371 AND\n2 1 12 44 372 AND\n2 1 23 55 339 AND\n2 1 26 58 368 AND\n1 1 56 398 INV\n1 1 3 314 INV\n1 1 40 346 INV\n1 1 62 378 INV\n1 1 6 389 INV\n1 1 28 401 INV\n1 1 10 377 INV\n1 1 13 391 INV\n1 1 27 335 INV\n1 1 7 387 INV\n1 1 24 399 INV\n1 1 54 327 INV\n1 1 36 315 INV\n1 1 52 332 INV\n1 1 50 380 INV\n1 1 57 404 INV\n1 1 31 323 INV\n1 1 55 317 INV\n1 1 18 381 INV\n1 1 60 400 INV\n1 1 5 322 INV\n1 1 14 395 INV\n1 1 47 402 INV\n1 1 8 347 INV\n1 1 19 385 INV\n1 1 53 374 INV\n1 1 29 330 INV\n1 1 1 382 INV\n1 1 34 344 INV\n1 1 20 333 INV\n1 1 37 321 INV\n1 1 45 390 INV\n1 1 11 338 INV\n1 1 42 376 INV\n1 1 12 370 INV\n1 1 38 388 INV\n1 1 23 318 INV\n1 1 41 392 INV\n1 1 61 329 INV\n1 1 15 403 INV\n1 1 48 396 INV\n1 1 26 320 INV\n1 1 43 337 INV\n1 1 59 334 INV\n1 1 9 393 INV\n1 1 58 319 INV\n1 1 17 326 INV\n1 1 44 369 INV\n1 1 21 375 INV\n1 1 49 325 INV\n1 1 16 397 INV\n1 1 25 405 INV\n1 1 51 384 INV\n1 1 4 316 INV\n1 1 2 345 INV\n1 1 39 386 INV\n1 1 46 394 INV\n1 1 35 313 INV\n1 1 22 328 INV\n1 1 63 324 INV\n1 1 33 383 INV\n1 1 30 379 INV\n2 1 313 314 282 AND\n2 1 315 316 283 AND\n2 1 317 318 284 AND\n2 1 319 320 299 AND\n2 1 321 322 285 AND\n2 1 323 324 286 AND\n2 1 325 326 288 AND\n2 1 327 328 289 AND\n2 1 329 330 290 AND\n1 1 331 130 INV\n2 1 332 333 287 AND\n2 1 334 335 292 AND\n1 1 336 256 INV\n2 1 337 338 293 AND\n1 1 339 123 INV\n1 1 340 214 INV\n1 1 341 116 INV\n1 1 342 228 INV\n1 1 343 276 INV\n2 1 344 345 310 AND\n2 1 346 347 300 AND\n1 1 348 235 INV\n1 1 349 88 INV\n1 1 350 151 INV\n1 1 351 270 INV\n1 1 352 193 INV\n1 1 353 158 INV\n1 1 354 109 INV\n1 1 355 207 INV\n1 1 356 263 INV\n1 1 357 66 INV\n1 1 358 95 INV\n1 1 359 172 INV\n1 1 360 179 INV\n1 1 361 165 INV\n1 1 362 81 INV\n1 1 363 221 INV\n1 1 364 74 INV\n1 1 365 242 INV\n1 1 366 186 INV\n1 1 367 144 INV\n1 1 368 102 INV\n2 1 369 370 301 AND\n1 1 371 137 INV\n1 1 372 200 INV\n1 1 373 249 INV\n2 1 374 375 298 AND\n2 1 376 377 296 AND\n2 1 378 379 291 AND\n2 1 380 381 297 AND\n2 1 382 383 306 AND\n2 1 384 385 294 AND\n2 1 386 387 295 AND\n2 1 388 389 302 AND\n2 1 390 391 303 AND\n2 1 392 393 304 AND\n2 1 394 395 305 AND\n2 1 396 397 307 AND\n2 1 398 399 308 AND\n2 1 400 401 309 AND\n2 1 402 403 311 AND\n2 1 404 405 312 AND\n1 1 282 266 INV\n1 1 283 259 INV\n1 1 284 126 INV\n1 1 285 252 INV\n1 1 286 69 INV\n1 1 287 147 INV\n1 1 288 168 INV\n1 1 289 133 INV\n1 1 290 84 INV\n1 1 291 77 INV\n1 1 292 98 INV\n1 1 293 210 INV\n1 1 294 154 INV\n1 1 295 238 INV\n1 1 296 217 INV\n1 1 297 161 INV\n1 1 298 140 INV\n1 1 299 105 INV\n1 1 300 231 INV\n1 1 301 203 INV\n1 1 302 245 INV\n1 1 303 196 INV\n1 1 304 224 INV\n1 1 305 189 INV\n1 1 306 281 INV\n1 1 307 175 INV\n1 1 308 119 INV\n1 1 309 91 INV\n1 1 310 273 INV\n1 1 311 182 INV\n1 1 312 112 INV\n2 1 281 276 277 AND\n2 1 69 66 279 AND\n2 1 281 278 280 AND\n2 1 277 278 407 XOR\n1 1 279 71 INV\n1 1 280 275 INV\n2 1 275 276 274 AND\n1 1 274 271 INV\n2 1 2 271 268 XOR\n2 1 271 273 272 AND\n2 1 34 268 408 XOR\n1 1 272 269 INV\n2 1 269 270 267 AND\n1 1 267 264 INV\n2 1 3 264 261 XOR\n2 1 264 266 265 AND\n2 1 35 261 409 XOR\n1 1 265 262 INV\n2 1 262 263 260 AND\n1 1 260 257 INV\n2 1 4 257 253 XOR\n2 1 257 259 258 AND\n2 1 36 253 410 XOR\n1 1 258 255 INV\n2 1 255 256 254 AND\n1 1 254 250 INV\n2 1 5 250 247 XOR\n2 1 250 252 251 AND\n2 1 37 247 411 XOR\n1 1 251 248 INV\n2 1 248 249 246 AND\n1 1 246 243 INV\n2 1 6 243 239 XOR\n2 1 243 245 244 AND\n2 1 38 239 412 XOR\n1 1 244 241 INV\n2 1 241 242 240 AND\n1 1 240 236 INV\n2 1 7 236 233 XOR\n2 1 236 238 237 AND\n2 1 39 233 413 XOR\n1 1 237 234 INV\n2 1 234 235 232 AND\n1 1 232 229 INV\n2 1 8 229 226 XOR\n2 1 229 231 230 AND\n2 1 40 226 414 XOR\n1 1 230 227 INV\n2 1 227 228 225 AND\n1 1 225 222 INV\n2 1 9 222 219 XOR\n2 1 222 224 223 AND\n2 1 41 219 415 XOR\n1 1 223 220 INV\n2 1 220 221 218 AND\n1 1 218 215 INV\n2 1 10 215 212 XOR\n2 1 215 217 216 AND\n2 1 42 212 416 XOR\n1 1 216 213 INV\n2 1 213 214 211 AND\n1 1 211 208 INV\n2 1 11 208 205 XOR\n2 1 208 210 209 AND\n2 1 43 205 417 XOR\n1 1 209 206 INV\n2 1 206 207 204 AND\n1 1 204 201 INV\n2 1 12 201 198 XOR\n2 1 201 203 202 AND\n2 1 44 198 418 XOR\n1 1 202 199 INV\n2 1 199 200 197 AND\n1 1 197 195 INV\n2 1 13 195 190 XOR\n2 1 195 196 194 AND\n2 1 45 190 419 XOR\n1 1 194 192 INV\n2 1 192 193 191 AND\n1 1 191 187 INV\n2 1 14 187 183 XOR\n2 1 187 189 188 AND\n2 1 46 183 420 XOR\n1 1 188 185 INV\n2 1 185 186 184 AND\n1 1 184 180 INV\n2 1 15 180 177 XOR\n2 1 180 182 181 AND\n2 1 47 177 421 XOR\n1 1 181 178 INV\n2 1 178 179 176 AND\n1 1 176 173 INV\n2 1 48 173 170 XOR\n2 1 173 175 174 AND\n2 1 16 170 422 XOR\n1 1 174 171 INV\n2 1 171 172 169 AND\n1 1 169 166 INV\n2 1 17 166 163 XOR\n2 1 166 168 167 AND\n2 1 49 163 423 XOR\n1 1 167 164 INV\n2 1 164 165 162 AND\n1 1 162 159 INV\n2 1 18 159 156 XOR\n2 1 159 161 160 AND\n2 1 50 156 424 XOR\n1 1 160 157 INV\n2 1 157 158 155 AND\n1 1 155 152 INV\n2 1 19 152 149 XOR\n2 1 152 154 153 AND\n2 1 51 149 425 XOR\n1 1 153 150 INV\n2 1 150 151 148 AND\n1 1 148 145 INV\n2 1 20 145 141 XOR\n2 1 145 147 146 AND\n2 1 52 141 426 XOR\n1 1 146 143 INV\n2 1 143 144 142 AND\n1 1 142 138 INV\n2 1 53 138 135 XOR\n2 1 138 140 139 AND\n2 1 21 135 427 XOR\n1 1 139 136 INV\n2 1 136 137 134 AND\n1 1 134 132 INV\n2 1 22 132 127 XOR\n2 1 132 133 131 AND\n2 1 54 127 428 XOR\n1 1 131 129 INV\n2 1 129 130 128 AND\n1 1 128 124 INV\n2 1 23 124 121 XOR\n2 1 124 126 125 AND\n2 1 55 121 429 XOR\n1 1 125 122 INV\n2 1 122 123 120 AND\n1 1 120 117 INV\n2 1 24 117 114 XOR\n2 1 117 119 118 AND\n2 1 56 114 430 XOR\n1 1 118 115 INV\n2 1 115 116 113 AND\n1 1 113 110 INV\n2 1 25 110 107 XOR\n2 1 110 112 111 AND\n2 1 57 107 431 XOR\n1 1 111 108 INV\n2 1 108 109 106 AND\n1 1 106 103 INV\n2 1 26 103 100 XOR\n2 1 103 105 104 AND\n2 1 58 100 432 XOR\n1 1 104 101 INV\n2 1 101 102 99 AND\n1 1 99 96 INV\n2 1 59 96 93 XOR\n2 1 96 98 97 AND\n2 1 27 93 433 XOR\n1 1 97 94 INV\n2 1 94 95 92 AND\n1 1 92 89 INV\n2 1 28 89 86 XOR\n2 1 89 91 90 AND\n2 1 60 86 434 XOR\n1 1 90 87 INV\n2 1 87 88 85 AND\n1 1 85 83 INV\n2 1 61 83 79 XOR\n2 1 83 84 82 AND\n2 1 29 79 435 XOR\n1 1 82 80 INV\n2 1 80 81 78 AND\n1 1 78 76 INV\n2 1 30 76 72 XOR\n2 1 76 77 75 AND\n2 1 62 72 436 XOR\n1 1 75 73 INV\n2 1 73 74 70 AND\n2 1 70 71 437 XOR\n1 1 70 68 INV\n2 1 68 69 67 AND\n1 1 67 65 INV\n2 1 65 66 64 AND\n1 1 64 438 INV";
var add32_json = {
  "wire_count":439, "gate_count":375,
  "value_in_count":2, "value_in_length":[32,32],
  "value_out_count":1, "value_out_length":[33],  
  "wire_in_count":64, "wire_in_index":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],
  "wire_out_count":33, "wire_out_index":[407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439],
  "gate":[
    {"wire_in_index":[1,33], "wire_out_index":[407], "operation":"xor"},
    {"wire_in_index":[6,38], "wire_out_index":[374], "operation":"and"},
    {"wire_in_index":[5,37], "wire_out_index":[337], "operation":"and"},
    {"wire_in_index":[11,43], "wire_out_index":[341], "operation":"and"},
    {"wire_in_index":[15,47], "wire_out_index":[367], "operation":"and"},
    {"wire_in_index":[25,57], "wire_out_index":[342], "operation":"and"},
    {"wire_in_index":[9,41], "wire_out_index":[343], "operation":"and"},
    {"wire_in_index":[2,34], "wire_out_index":[344], "operation":"and"},
    {"wire_in_index":[8,40], "wire_out_index":[349], "operation":"and"},
    {"wire_in_index":[29,61], "wire_out_index":[350], "operation":"and"},
    {"wire_in_index":[20,52], "wire_out_index":[351], "operation":"and"},
    {"wire_in_index":[3,35], "wire_out_index":[352], "operation":"and"},
    {"wire_in_index":[31,63], "wire_out_index":[365], "operation":"and"},
    {"wire_in_index":[14,46], "wire_out_index":[353], "operation":"and"},
    {"wire_in_index":[19,51], "wire_out_index":[354], "operation":"and"},
    {"wire_in_index":[12,44], "wire_out_index":[356], "operation":"and"},
    {"wire_in_index":[4,36], "wire_out_index":[357], "operation":"and"},
    {"wire_in_index":[17,49], "wire_out_index":[360], "operation":"and"},
    {"wire_in_index":[32,64], "wire_out_index":[358], "operation":"and"},
    {"wire_in_index":[28,60], "wire_out_index":[359], "operation":"and"},
    {"wire_in_index":[16,48], "wire_out_index":[361], "operation":"and"},
    {"wire_in_index":[18,50], "wire_out_index":[362], "operation":"and"},
    {"wire_in_index":[10,42], "wire_out_index":[364], "operation":"and"},
    {"wire_in_index":[33,1], "wire_out_index":[279], "operation":"and"},
    {"wire_in_index":[30,62], "wire_out_index":[363], "operation":"and"},
    {"wire_in_index":[7,39], "wire_out_index":[366], "operation":"and"},
    {"wire_in_index":[26,58], "wire_out_index":[355], "operation":"and"},
    {"wire_in_index":[21,53], "wire_out_index":[368], "operation":"and"},
    {"wire_in_index":[23,55], "wire_out_index":[332], "operation":"and"},
    {"wire_in_index":[22,54], "wire_out_index":[372], "operation":"and"},
    {"wire_in_index":[13,45], "wire_out_index":[373], "operation":"and"},
    {"wire_in_index":[24,56], "wire_out_index":[340], "operation":"and"},
    {"wire_in_index":[27,59], "wire_out_index":[369], "operation":"and"},
    {"wire_in_index":[57], "wire_out_index":[399], "operation":"not"},
    {"wire_in_index":[4], "wire_out_index":[315], "operation":"not"},
    {"wire_in_index":[41], "wire_out_index":[347], "operation":"not"},
    {"wire_in_index":[63], "wire_out_index":[379], "operation":"not"},
    {"wire_in_index":[7], "wire_out_index":[390], "operation":"not"},
    {"wire_in_index":[29], "wire_out_index":[402], "operation":"not"},
    {"wire_in_index":[11], "wire_out_index":[378], "operation":"not"},
    {"wire_in_index":[14], "wire_out_index":[392], "operation":"not"},
    {"wire_in_index":[28], "wire_out_index":[336], "operation":"not"},
    {"wire_in_index":[8], "wire_out_index":[388], "operation":"not"},
    {"wire_in_index":[25], "wire_out_index":[400], "operation":"not"},
    {"wire_in_index":[55], "wire_out_index":[328], "operation":"not"},
    {"wire_in_index":[37], "wire_out_index":[316], "operation":"not"},
    {"wire_in_index":[53], "wire_out_index":[333], "operation":"not"},
    {"wire_in_index":[51], "wire_out_index":[381], "operation":"not"},
    {"wire_in_index":[58], "wire_out_index":[405], "operation":"not"},
    {"wire_in_index":[32], "wire_out_index":[324], "operation":"not"},
    {"wire_in_index":[56], "wire_out_index":[318], "operation":"not"},
    {"wire_in_index":[19], "wire_out_index":[382], "operation":"not"},
    {"wire_in_index":[61], "wire_out_index":[401], "operation":"not"},
    {"wire_in_index":[6], "wire_out_index":[323], "operation":"not"},
    {"wire_in_index":[15], "wire_out_index":[396], "operation":"not"},
    {"wire_in_index":[48], "wire_out_index":[403], "operation":"not"},
    {"wire_in_index":[9], "wire_out_index":[348], "operation":"not"},
    {"wire_in_index":[20], "wire_out_index":[386], "operation":"not"},
    {"wire_in_index":[54], "wire_out_index":[375], "operation":"not"},
    {"wire_in_index":[30], "wire_out_index":[331], "operation":"not"},
    {"wire_in_index":[2], "wire_out_index":[383], "operation":"not"},
    {"wire_in_index":[35], "wire_out_index":[345], "operation":"not"},
    {"wire_in_index":[21], "wire_out_index":[334], "operation":"not"},
    {"wire_in_index":[38], "wire_out_index":[322], "operation":"not"},
    {"wire_in_index":[46], "wire_out_index":[391], "operation":"not"},
    {"wire_in_index":[12], "wire_out_index":[339], "operation":"not"},
    {"wire_in_index":[43], "wire_out_index":[377], "operation":"not"},
    {"wire_in_index":[13], "wire_out_index":[371], "operation":"not"},
    {"wire_in_index":[39], "wire_out_index":[389], "operation":"not"},
    {"wire_in_index":[24], "wire_out_index":[319], "operation":"not"},
    {"wire_in_index":[42], "wire_out_index":[393], "operation":"not"},
    {"wire_in_index":[62], "wire_out_index":[330], "operation":"not"},
    {"wire_in_index":[16], "wire_out_index":[404], "operation":"not"},
    {"wire_in_index":[49], "wire_out_index":[397], "operation":"not"},
    {"wire_in_index":[27], "wire_out_index":[321], "operation":"not"},
    {"wire_in_index":[44], "wire_out_index":[338], "operation":"not"},
    {"wire_in_index":[60], "wire_out_index":[335], "operation":"not"},
    {"wire_in_index":[10], "wire_out_index":[394], "operation":"not"},
    {"wire_in_index":[59], "wire_out_index":[320], "operation":"not"},
    {"wire_in_index":[18], "wire_out_index":[327], "operation":"not"},
    {"wire_in_index":[45], "wire_out_index":[370], "operation":"not"},
    {"wire_in_index":[22], "wire_out_index":[376], "operation":"not"},
    {"wire_in_index":[50], "wire_out_index":[326], "operation":"not"},
    {"wire_in_index":[17], "wire_out_index":[398], "operation":"not"},
    {"wire_in_index":[26], "wire_out_index":[406], "operation":"not"},
    {"wire_in_index":[52], "wire_out_index":[385], "operation":"not"},
    {"wire_in_index":[5], "wire_out_index":[317], "operation":"not"},
    {"wire_in_index":[3], "wire_out_index":[346], "operation":"not"},
    {"wire_in_index":[40], "wire_out_index":[387], "operation":"not"},
    {"wire_in_index":[47], "wire_out_index":[395], "operation":"not"},
    {"wire_in_index":[36], "wire_out_index":[314], "operation":"not"},
    {"wire_in_index":[23], "wire_out_index":[329], "operation":"not"},
    {"wire_in_index":[64], "wire_out_index":[325], "operation":"not"},
    {"wire_in_index":[34], "wire_out_index":[384], "operation":"not"},
    {"wire_in_index":[31], "wire_out_index":[380], "operation":"not"},
    {"wire_in_index":[314,315], "wire_out_index":[283], "operation":"and"},
    {"wire_in_index":[316,317], "wire_out_index":[284], "operation":"and"},
    {"wire_in_index":[318,319], "wire_out_index":[285], "operation":"and"},
    {"wire_in_index":[320,321], "wire_out_index":[300], "operation":"and"},
    {"wire_in_index":[322,323], "wire_out_index":[286], "operation":"and"},
    {"wire_in_index":[324,325], "wire_out_index":[287], "operation":"and"},
    {"wire_in_index":[326,327], "wire_out_index":[289], "operation":"and"},
    {"wire_in_index":[328,329], "wire_out_index":[290], "operation":"and"},
    {"wire_in_index":[330,331], "wire_out_index":[291], "operation":"and"},
    {"wire_in_index":[332], "wire_out_index":[131], "operation":"not"},
    {"wire_in_index":[333,334], "wire_out_index":[288], "operation":"and"},
    {"wire_in_index":[335,336], "wire_out_index":[293], "operation":"and"},
    {"wire_in_index":[337], "wire_out_index":[257], "operation":"not"},
    {"wire_in_index":[338,339], "wire_out_index":[294], "operation":"and"},
    {"wire_in_index":[340], "wire_out_index":[124], "operation":"not"},
    {"wire_in_index":[341], "wire_out_index":[215], "operation":"not"},
    {"wire_in_index":[342], "wire_out_index":[117], "operation":"not"},
    {"wire_in_index":[343], "wire_out_index":[229], "operation":"not"},
    {"wire_in_index":[344], "wire_out_index":[277], "operation":"not"},
    {"wire_in_index":[345,346], "wire_out_index":[311], "operation":"and"},
    {"wire_in_index":[347,348], "wire_out_index":[301], "operation":"and"},
    {"wire_in_index":[349], "wire_out_index":[236], "operation":"not"},
    {"wire_in_index":[350], "wire_out_index":[89], "operation":"not"},
    {"wire_in_index":[351], "wire_out_index":[152], "operation":"not"},
    {"wire_in_index":[352], "wire_out_index":[271], "operation":"not"},
    {"wire_in_index":[353], "wire_out_index":[194], "operation":"not"},
    {"wire_in_index":[354], "wire_out_index":[159], "operation":"not"},
    {"wire_in_index":[355], "wire_out_index":[110], "operation":"not"},
    {"wire_in_index":[356], "wire_out_index":[208], "operation":"not"},
    {"wire_in_index":[357], "wire_out_index":[264], "operation":"not"},
    {"wire_in_index":[358], "wire_out_index":[67], "operation":"not"},
    {"wire_in_index":[359], "wire_out_index":[96], "operation":"not"},
    {"wire_in_index":[360], "wire_out_index":[173], "operation":"not"},
    {"wire_in_index":[361], "wire_out_index":[180], "operation":"not"},
    {"wire_in_index":[362], "wire_out_index":[166], "operation":"not"},
    {"wire_in_index":[363], "wire_out_index":[82], "operation":"not"},
    {"wire_in_index":[364], "wire_out_index":[222], "operation":"not"},
    {"wire_in_index":[365], "wire_out_index":[75], "operation":"not"},
    {"wire_in_index":[366], "wire_out_index":[243], "operation":"not"},
    {"wire_in_index":[367], "wire_out_index":[187], "operation":"not"},
    {"wire_in_index":[368], "wire_out_index":[145], "operation":"not"},
    {"wire_in_index":[369], "wire_out_index":[103], "operation":"not"},
    {"wire_in_index":[370,371], "wire_out_index":[302], "operation":"and"},
    {"wire_in_index":[372], "wire_out_index":[138], "operation":"not"},
    {"wire_in_index":[373], "wire_out_index":[201], "operation":"not"},
    {"wire_in_index":[374], "wire_out_index":[250], "operation":"not"},
    {"wire_in_index":[375,376], "wire_out_index":[299], "operation":"and"},
    {"wire_in_index":[377,378], "wire_out_index":[297], "operation":"and"},
    {"wire_in_index":[379,380], "wire_out_index":[292], "operation":"and"},
    {"wire_in_index":[381,382], "wire_out_index":[298], "operation":"and"},
    {"wire_in_index":[383,384], "wire_out_index":[307], "operation":"and"},
    {"wire_in_index":[385,386], "wire_out_index":[295], "operation":"and"},
    {"wire_in_index":[387,388], "wire_out_index":[296], "operation":"and"},
    {"wire_in_index":[389,390], "wire_out_index":[303], "operation":"and"},
    {"wire_in_index":[391,392], "wire_out_index":[304], "operation":"and"},
    {"wire_in_index":[393,394], "wire_out_index":[305], "operation":"and"},
    {"wire_in_index":[395,396], "wire_out_index":[306], "operation":"and"},
    {"wire_in_index":[397,398], "wire_out_index":[308], "operation":"and"},
    {"wire_in_index":[399,400], "wire_out_index":[309], "operation":"and"},
    {"wire_in_index":[401,402], "wire_out_index":[310], "operation":"and"},
    {"wire_in_index":[403,404], "wire_out_index":[312], "operation":"and"},
    {"wire_in_index":[405,406], "wire_out_index":[313], "operation":"and"},
    {"wire_in_index":[283], "wire_out_index":[267], "operation":"not"},
    {"wire_in_index":[284], "wire_out_index":[260], "operation":"not"},
    {"wire_in_index":[285], "wire_out_index":[127], "operation":"not"},
    {"wire_in_index":[286], "wire_out_index":[253], "operation":"not"},
    {"wire_in_index":[287], "wire_out_index":[70], "operation":"not"},
    {"wire_in_index":[288], "wire_out_index":[148], "operation":"not"},
    {"wire_in_index":[289], "wire_out_index":[169], "operation":"not"},
    {"wire_in_index":[290], "wire_out_index":[134], "operation":"not"},
    {"wire_in_index":[291], "wire_out_index":[85], "operation":"not"},
    {"wire_in_index":[292], "wire_out_index":[78], "operation":"not"},
    {"wire_in_index":[293], "wire_out_index":[99], "operation":"not"},
    {"wire_in_index":[294], "wire_out_index":[211], "operation":"not"},
    {"wire_in_index":[295], "wire_out_index":[155], "operation":"not"},
    {"wire_in_index":[296], "wire_out_index":[239], "operation":"not"},
    {"wire_in_index":[297], "wire_out_index":[218], "operation":"not"},
    {"wire_in_index":[298], "wire_out_index":[162], "operation":"not"},
    {"wire_in_index":[299], "wire_out_index":[141], "operation":"not"},
    {"wire_in_index":[300], "wire_out_index":[106], "operation":"not"},
    {"wire_in_index":[301], "wire_out_index":[232], "operation":"not"},
    {"wire_in_index":[302], "wire_out_index":[204], "operation":"not"},
    {"wire_in_index":[303], "wire_out_index":[246], "operation":"not"},
    {"wire_in_index":[304], "wire_out_index":[197], "operation":"not"},
    {"wire_in_index":[305], "wire_out_index":[225], "operation":"not"},
    {"wire_in_index":[306], "wire_out_index":[190], "operation":"not"},
    {"wire_in_index":[307], "wire_out_index":[282], "operation":"not"},
    {"wire_in_index":[308], "wire_out_index":[176], "operation":"not"},
    {"wire_in_index":[309], "wire_out_index":[120], "operation":"not"},
    {"wire_in_index":[310], "wire_out_index":[92], "operation":"not"},
    {"wire_in_index":[311], "wire_out_index":[274], "operation":"not"},
    {"wire_in_index":[312], "wire_out_index":[183], "operation":"not"},
    {"wire_in_index":[313], "wire_out_index":[113], "operation":"not"},
    {"wire_in_index":[282,277], "wire_out_index":[278], "operation":"and"},
    {"wire_in_index":[70,67], "wire_out_index":[280], "operation":"and"},
    {"wire_in_index":[282,279], "wire_out_index":[281], "operation":"and"},
    {"wire_in_index":[278,279], "wire_out_index":[408], "operation":"xor"},
    {"wire_in_index":[280], "wire_out_index":[72], "operation":"not"},
    {"wire_in_index":[281], "wire_out_index":[276], "operation":"not"},
    {"wire_in_index":[276,277], "wire_out_index":[275], "operation":"and"},
    {"wire_in_index":[275], "wire_out_index":[272], "operation":"not"},
    {"wire_in_index":[3,272], "wire_out_index":[269], "operation":"xor"},
    {"wire_in_index":[272,274], "wire_out_index":[273], "operation":"and"},
    {"wire_in_index":[35,269], "wire_out_index":[409], "operation":"xor"},
    {"wire_in_index":[273], "wire_out_index":[270], "operation":"not"},
    {"wire_in_index":[270,271], "wire_out_index":[268], "operation":"and"},
    {"wire_in_index":[268], "wire_out_index":[265], "operation":"not"},
    {"wire_in_index":[4,265], "wire_out_index":[262], "operation":"xor"},
    {"wire_in_index":[265,267], "wire_out_index":[266], "operation":"and"},
    {"wire_in_index":[36,262], "wire_out_index":[410], "operation":"xor"},
    {"wire_in_index":[266], "wire_out_index":[263], "operation":"not"},
    {"wire_in_index":[263,264], "wire_out_index":[261], "operation":"and"},
    {"wire_in_index":[261], "wire_out_index":[258], "operation":"not"},
    {"wire_in_index":[5,258], "wire_out_index":[254], "operation":"xor"},
    {"wire_in_index":[258,260], "wire_out_index":[259], "operation":"and"},
    {"wire_in_index":[37,254], "wire_out_index":[411], "operation":"xor"},
    {"wire_in_index":[259], "wire_out_index":[256], "operation":"not"},
    {"wire_in_index":[256,257], "wire_out_index":[255], "operation":"and"},
    {"wire_in_index":[255], "wire_out_index":[251], "operation":"not"},
    {"wire_in_index":[6,251], "wire_out_index":[248], "operation":"xor"},
    {"wire_in_index":[251,253], "wire_out_index":[252], "operation":"and"},
    {"wire_in_index":[38,248], "wire_out_index":[412], "operation":"xor"},
    {"wire_in_index":[252], "wire_out_index":[249], "operation":"not"},
    {"wire_in_index":[249,250], "wire_out_index":[247], "operation":"and"},
    {"wire_in_index":[247], "wire_out_index":[244], "operation":"not"},
    {"wire_in_index":[7,244], "wire_out_index":[240], "operation":"xor"},
    {"wire_in_index":[244,246], "wire_out_index":[245], "operation":"and"},
    {"wire_in_index":[39,240], "wire_out_index":[413], "operation":"xor"},
    {"wire_in_index":[245], "wire_out_index":[242], "operation":"not"},
    {"wire_in_index":[242,243], "wire_out_index":[241], "operation":"and"},
    {"wire_in_index":[241], "wire_out_index":[237], "operation":"not"},
    {"wire_in_index":[8,237], "wire_out_index":[234], "operation":"xor"},
    {"wire_in_index":[237,239], "wire_out_index":[238], "operation":"and"},
    {"wire_in_index":[40,234], "wire_out_index":[414], "operation":"xor"},
    {"wire_in_index":[238], "wire_out_index":[235], "operation":"not"},
    {"wire_in_index":[235,236], "wire_out_index":[233], "operation":"and"},
    {"wire_in_index":[233], "wire_out_index":[230], "operation":"not"},
    {"wire_in_index":[9,230], "wire_out_index":[227], "operation":"xor"},
    {"wire_in_index":[230,232], "wire_out_index":[231], "operation":"and"},
    {"wire_in_index":[41,227], "wire_out_index":[415], "operation":"xor"},
    {"wire_in_index":[231], "wire_out_index":[228], "operation":"not"},
    {"wire_in_index":[228,229], "wire_out_index":[226], "operation":"and"},
    {"wire_in_index":[226], "wire_out_index":[223], "operation":"not"},
    {"wire_in_index":[10,223], "wire_out_index":[220], "operation":"xor"},
    {"wire_in_index":[223,225], "wire_out_index":[224], "operation":"and"},
    {"wire_in_index":[42,220], "wire_out_index":[416], "operation":"xor"},
    {"wire_in_index":[224], "wire_out_index":[221], "operation":"not"},
    {"wire_in_index":[221,222], "wire_out_index":[219], "operation":"and"},
    {"wire_in_index":[219], "wire_out_index":[216], "operation":"not"},
    {"wire_in_index":[11,216], "wire_out_index":[213], "operation":"xor"},
    {"wire_in_index":[216,218], "wire_out_index":[217], "operation":"and"},
    {"wire_in_index":[43,213], "wire_out_index":[417], "operation":"xor"},
    {"wire_in_index":[217], "wire_out_index":[214], "operation":"not"},
    {"wire_in_index":[214,215], "wire_out_index":[212], "operation":"and"},
    {"wire_in_index":[212], "wire_out_index":[209], "operation":"not"},
    {"wire_in_index":[12,209], "wire_out_index":[206], "operation":"xor"},
    {"wire_in_index":[209,211], "wire_out_index":[210], "operation":"and"},
    {"wire_in_index":[44,206], "wire_out_index":[418], "operation":"xor"},
    {"wire_in_index":[210], "wire_out_index":[207], "operation":"not"},
    {"wire_in_index":[207,208], "wire_out_index":[205], "operation":"and"},
    {"wire_in_index":[205], "wire_out_index":[202], "operation":"not"},
    {"wire_in_index":[13,202], "wire_out_index":[199], "operation":"xor"},
    {"wire_in_index":[202,204], "wire_out_index":[203], "operation":"and"},
    {"wire_in_index":[45,199], "wire_out_index":[419], "operation":"xor"},
    {"wire_in_index":[203], "wire_out_index":[200], "operation":"not"},
    {"wire_in_index":[200,201], "wire_out_index":[198], "operation":"and"},
    {"wire_in_index":[198], "wire_out_index":[196], "operation":"not"},
    {"wire_in_index":[14,196], "wire_out_index":[191], "operation":"xor"},
    {"wire_in_index":[196,197], "wire_out_index":[195], "operation":"and"},
    {"wire_in_index":[46,191], "wire_out_index":[420], "operation":"xor"},
    {"wire_in_index":[195], "wire_out_index":[193], "operation":"not"},
    {"wire_in_index":[193,194], "wire_out_index":[192], "operation":"and"},
    {"wire_in_index":[192], "wire_out_index":[188], "operation":"not"},
    {"wire_in_index":[15,188], "wire_out_index":[184], "operation":"xor"},
    {"wire_in_index":[188,190], "wire_out_index":[189], "operation":"and"},
    {"wire_in_index":[47,184], "wire_out_index":[421], "operation":"xor"},
    {"wire_in_index":[189], "wire_out_index":[186], "operation":"not"},
    {"wire_in_index":[186,187], "wire_out_index":[185], "operation":"and"},
    {"wire_in_index":[185], "wire_out_index":[181], "operation":"not"},
    {"wire_in_index":[16,181], "wire_out_index":[178], "operation":"xor"},
    {"wire_in_index":[181,183], "wire_out_index":[182], "operation":"and"},
    {"wire_in_index":[48,178], "wire_out_index":[422], "operation":"xor"},
    {"wire_in_index":[182], "wire_out_index":[179], "operation":"not"},
    {"wire_in_index":[179,180], "wire_out_index":[177], "operation":"and"},
    {"wire_in_index":[177], "wire_out_index":[174], "operation":"not"},
    {"wire_in_index":[49,174], "wire_out_index":[171], "operation":"xor"},
    {"wire_in_index":[174,176], "wire_out_index":[175], "operation":"and"},
    {"wire_in_index":[17,171], "wire_out_index":[423], "operation":"xor"},
    {"wire_in_index":[175], "wire_out_index":[172], "operation":"not"},
    {"wire_in_index":[172,173], "wire_out_index":[170], "operation":"and"},
    {"wire_in_index":[170], "wire_out_index":[167], "operation":"not"},
    {"wire_in_index":[18,167], "wire_out_index":[164], "operation":"xor"},
    {"wire_in_index":[167,169], "wire_out_index":[168], "operation":"and"},
    {"wire_in_index":[50,164], "wire_out_index":[424], "operation":"xor"},
    {"wire_in_index":[168], "wire_out_index":[165], "operation":"not"},
    {"wire_in_index":[165,166], "wire_out_index":[163], "operation":"and"},
    {"wire_in_index":[163], "wire_out_index":[160], "operation":"not"},
    {"wire_in_index":[19,160], "wire_out_index":[157], "operation":"xor"},
    {"wire_in_index":[160,162], "wire_out_index":[161], "operation":"and"},
    {"wire_in_index":[51,157], "wire_out_index":[425], "operation":"xor"},
    {"wire_in_index":[161], "wire_out_index":[158], "operation":"not"},
    {"wire_in_index":[158,159], "wire_out_index":[156], "operation":"and"},
    {"wire_in_index":[156], "wire_out_index":[153], "operation":"not"},
    {"wire_in_index":[20,153], "wire_out_index":[150], "operation":"xor"},
    {"wire_in_index":[153,155], "wire_out_index":[154], "operation":"and"},
    {"wire_in_index":[52,150], "wire_out_index":[426], "operation":"xor"},
    {"wire_in_index":[154], "wire_out_index":[151], "operation":"not"},
    {"wire_in_index":[151,152], "wire_out_index":[149], "operation":"and"},
    {"wire_in_index":[149], "wire_out_index":[146], "operation":"not"},
    {"wire_in_index":[21,146], "wire_out_index":[142], "operation":"xor"},
    {"wire_in_index":[146,148], "wire_out_index":[147], "operation":"and"},
    {"wire_in_index":[53,142], "wire_out_index":[427], "operation":"xor"},
    {"wire_in_index":[147], "wire_out_index":[144], "operation":"not"},
    {"wire_in_index":[144,145], "wire_out_index":[143], "operation":"and"},
    {"wire_in_index":[143], "wire_out_index":[139], "operation":"not"},
    {"wire_in_index":[54,139], "wire_out_index":[136], "operation":"xor"},
    {"wire_in_index":[139,141], "wire_out_index":[140], "operation":"and"},
    {"wire_in_index":[22,136], "wire_out_index":[428], "operation":"xor"},
    {"wire_in_index":[140], "wire_out_index":[137], "operation":"not"},
    {"wire_in_index":[137,138], "wire_out_index":[135], "operation":"and"},
    {"wire_in_index":[135], "wire_out_index":[133], "operation":"not"},
    {"wire_in_index":[23,133], "wire_out_index":[128], "operation":"xor"},
    {"wire_in_index":[133,134], "wire_out_index":[132], "operation":"and"},
    {"wire_in_index":[55,128], "wire_out_index":[429], "operation":"xor"},
    {"wire_in_index":[132], "wire_out_index":[130], "operation":"not"},
    {"wire_in_index":[130,131], "wire_out_index":[129], "operation":"and"},
    {"wire_in_index":[129], "wire_out_index":[125], "operation":"not"},
    {"wire_in_index":[24,125], "wire_out_index":[122], "operation":"xor"},
    {"wire_in_index":[125,127], "wire_out_index":[126], "operation":"and"},
    {"wire_in_index":[56,122], "wire_out_index":[430], "operation":"xor"},
    {"wire_in_index":[126], "wire_out_index":[123], "operation":"not"},
    {"wire_in_index":[123,124], "wire_out_index":[121], "operation":"and"},
    {"wire_in_index":[121], "wire_out_index":[118], "operation":"not"},
    {"wire_in_index":[25,118], "wire_out_index":[115], "operation":"xor"},
    {"wire_in_index":[118,120], "wire_out_index":[119], "operation":"and"},
    {"wire_in_index":[57,115], "wire_out_index":[431], "operation":"xor"},
    {"wire_in_index":[119], "wire_out_index":[116], "operation":"not"},
    {"wire_in_index":[116,117], "wire_out_index":[114], "operation":"and"},
    {"wire_in_index":[114], "wire_out_index":[111], "operation":"not"},
    {"wire_in_index":[26,111], "wire_out_index":[108], "operation":"xor"},
    {"wire_in_index":[111,113], "wire_out_index":[112], "operation":"and"},
    {"wire_in_index":[58,108], "wire_out_index":[432], "operation":"xor"},
    {"wire_in_index":[112], "wire_out_index":[109], "operation":"not"},
    {"wire_in_index":[109,110], "wire_out_index":[107], "operation":"and"},
    {"wire_in_index":[107], "wire_out_index":[104], "operation":"not"},
    {"wire_in_index":[27,104], "wire_out_index":[101], "operation":"xor"},
    {"wire_in_index":[104,106], "wire_out_index":[105], "operation":"and"},
    {"wire_in_index":[59,101], "wire_out_index":[433], "operation":"xor"},
    {"wire_in_index":[105], "wire_out_index":[102], "operation":"not"},
    {"wire_in_index":[102,103], "wire_out_index":[100], "operation":"and"},
    {"wire_in_index":[100], "wire_out_index":[97], "operation":"not"},
    {"wire_in_index":[60,97], "wire_out_index":[94], "operation":"xor"},
    {"wire_in_index":[97,99], "wire_out_index":[98], "operation":"and"},
    {"wire_in_index":[28,94], "wire_out_index":[434], "operation":"xor"},
    {"wire_in_index":[98], "wire_out_index":[95], "operation":"not"},
    {"wire_in_index":[95,96], "wire_out_index":[93], "operation":"and"},
    {"wire_in_index":[93], "wire_out_index":[90], "operation":"not"},
    {"wire_in_index":[29,90], "wire_out_index":[87], "operation":"xor"},
    {"wire_in_index":[90,92], "wire_out_index":[91], "operation":"and"},
    {"wire_in_index":[61,87], "wire_out_index":[435], "operation":"xor"},
    {"wire_in_index":[91], "wire_out_index":[88], "operation":"not"},
    {"wire_in_index":[88,89], "wire_out_index":[86], "operation":"and"},
    {"wire_in_index":[86], "wire_out_index":[84], "operation":"not"},
    {"wire_in_index":[62,84], "wire_out_index":[80], "operation":"xor"},
    {"wire_in_index":[84,85], "wire_out_index":[83], "operation":"and"},
    {"wire_in_index":[30,80], "wire_out_index":[436], "operation":"xor"},
    {"wire_in_index":[83], "wire_out_index":[81], "operation":"not"},
    {"wire_in_index":[81,82], "wire_out_index":[79], "operation":"and"},
    {"wire_in_index":[79], "wire_out_index":[77], "operation":"not"},
    {"wire_in_index":[31,77], "wire_out_index":[73], "operation":"xor"},
    {"wire_in_index":[77,78], "wire_out_index":[76], "operation":"and"},
    {"wire_in_index":[63,73], "wire_out_index":[437], "operation":"xor"},
    {"wire_in_index":[76], "wire_out_index":[74], "operation":"not"},
    {"wire_in_index":[74,75], "wire_out_index":[71], "operation":"and"},
    {"wire_in_index":[71,72], "wire_out_index":[438], "operation":"xor"},
    {"wire_in_index":[71], "wire_out_index":[69], "operation":"not"},
    {"wire_in_index":[69,70], "wire_out_index":[68], "operation":"and"},
    {"wire_in_index":[68], "wire_out_index":[66], "operation":"not"},
    {"wire_in_index":[66,67], "wire_out_index":[65], "operation":"and"},
    {"wire_in_index":[65], "wire_out_index":[439], "operation":"not"}
  ]
};

/**
 * Run pure (functions only) end-to-end execution of entire protocol.
 * @param {Object} circuit - Circuit to garble and evaluate
 * @param {Object} input1 - Bit vector for first input
 * @param {Object} input2 - Bit vector for second input
 * @param {Object} channel - Communications channel to use for test
 * @returns {number[]} Computed bit vector output
 */
function protocolPureEndToEnd(circuit, input1, input2, chan) {
  chan = (chan == null) ? new channel.ChannelSimulated() : chan;

  // Steps performed by garbler.
  var wToLs_G = garble.generateWireToLabelsMap(circuit);
  var gatesGarbled_G = garble.garbleGates(circuit, wToLs_G);
  garble.sendInputWireToLabelsMap(chan, circuit, wToLs_G, input1.bits);
  chan.sendDirect('gatesGarbled', gatesGarbled_G.toJSONString());

  // Steps performed by evaluator.
  var messages = evaluate.receiveMessages(chan, circuit, input2.bits);
  var [gatesGarbled_E, wToL_E] = evaluate.processMessages(circuit, messages);
  var wToL_E2 = evaluate.evaluateGates(circuit, gatesGarbled_E, wToL_E)
                        .copyWithOnlyIndices(circuit.wire_out_index);
  var outputWireToLabels_E = wToL_E2.copyWithOnlyIndices(circuit.wire_out_index);
  chan.sendDirect('outputWireToLabels', outputWireToLabels_E.toJSONString());

  // Steps performed by garbler.
  var outputWireToLabels_G =
    assignment.fromJSONString(chan.receiveDirect('outputWireToLabels'));
  var output = garble.outputLabelsToBits(circuit, wToLs_G, outputWireToLabels_G);

  return new bits.Bits(output);
}

// The unit tests below do not require a cryptographic library.
describe('circuit', async function() {
  it('circuit.fromBristolFashion()', function() {
    expect(circuit.fromBristolFashion(and4_bristol).toJSON()).to.eql(and4_json);
    expect(circuit.fromBristolFashion(add32_bristol).toJSON()).to.eql(add32_json);
  });
  it('circuit.Circuit.prototype.toJSON()', async function() {
    let circuitSchemaString = await fs.readFile('./schemas/circuit.schema.json', 'utf8');
    let circuitSchema = JSON.parse(circuitSchemaString);
    expect(circuit.fromBristolFashion(and4_bristol).toJSON()).to.be.jsonSchema(circuitSchema);
    expect(circuit.fromBristolFashion(add32_bristol).toJSON()).to.be.jsonSchema(circuitSchema);
  });
});

// The unit tests below assume that libsodium has been loaded.
global.sodium = require('libsodium-wrappers');
beforeEach(async function() {
  await sodium.ready; // Wait for libsodium to load.
});
describe('end-to-end', function() {
  it('and4_circuit', function() {
    var input1 = new bits.Bits("01"), input2 = new bits.Bits("10");
    var and4_circuit = circuit.fromBristolFashion(and4_bristol);
    var outEval = and4_circuit.evaluate([input1, input2]);
    var outEtoE = protocolPureEndToEnd(and4_circuit, input1, input2);
    expect(outEval.toString()).to.eql(outEtoE.toString());
  });

  for (var r = 0; r < 5*2; r += 2) {
    it('add32_circuit', function() {
      var input1 = bits.random(32, r);
      var input2 = bits.random(32, r + 1);
      var add32_circuit = circuit.fromBristolFashion(add32_bristol);
      var outEval = add32_circuit.evaluate([input1, input2]);
      var outEtoE = protocolPureEndToEnd(add32_circuit, input1, input2);
      expect(outEval.toString()).to.eql(outEtoE.toString());
    });
  }

  // Circuits to test.
  let filenames = [
    'universal_1bit.txt',
    'and4.txt', 'and8.txt',
    'adder_32bit.txt', 'adder_64bit.txt', 'sub64.txt',
    'comparator_32bit_signed_lt.txt',
    'zero_equal_64.txt'//, 'zero_equal_128.txt'
    //,'mult_32x32.txt', 'mult64.txt', 'divide64.txt'
  ];

  // Mathematical reference functions corresponding to circuits.
  let functions = {
    'and4.txt': function (a, b) { return a.concat(b).andBits(); },
    'and8.txt': function (a, b) { return a.concat(b).andBits(); },
    'adder_32bit.txt': function (a, b) { return a.rev().add(b.rev()).pad(33).rev(); },
    'adder_64bit.txt': function (a, b) { return a.rev().add(b.rev()).pad(65).rev(); },
    'sub64.txt': function (a, b) { return a.rev().sub(b.rev()).pad(64).rev(); },
    'zero_equal_64.txt': function (a, b) { return a.concat(b).orBits().not(); },
  }

  // Test each circuit.
  for (let i = 0; i < filenames.length; i++) {
    it(filenames[i], async function() {
      // Create the simulated communications channel.
      var chan = new channel.ChannelSimulated();

      // Load circuit file and perform end-to-end test.
      let raw = await fs.readFile('./circuits/bristol/' + filenames[i], 'utf8');
      let c = circuit.fromBristolFashion(raw);
      let input1 = bits.random(c.wire_in_count/2, 1);
      let input2 = bits.random(c.wire_in_count/2, 2);
      let outEval = c.evaluate([input1, input2]);
      let outEtoE = protocolPureEndToEnd(c, input1, input2, chan);

      // Confirm that the circuit is mathematically correct if a
      // reference function for the circuit is provided.
      if (filenames[i] in functions) {
        let outRef = functions[filenames[i]](input1, input2);
        expect(outEval.toString()).to.eql(outRef.toString());
      }

      // Do the evaluation and end-to-end protocol output bit vectors match?
      expect(outEval.toString()).to.eql(outEtoE.toString());

      // Confirm that communicated messages conform to schemas.
      let gatesGarbledSchemaString = await fs.readFile('./schemas/gates.garbled.schema.json', 'utf8');
      let gatesGarbledSchema = JSON.parse(gatesGarbledSchemaString);
      expect(JSON.parse(chan.direct['gatesGarbled'])).to.be.jsonSchema(gatesGarbledSchema);

      let assignmentSchemaString = await fs.readFile('./schemas/assignment.schema.json', 'utf8');
      let assignmentSchema = JSON.parse(assignmentSchemaString);
      expect(JSON.parse(chan.direct['outputWireToLabels'])).to.be.jsonSchema(assignmentSchema);

      let labelSchemaString = await fs.readFile('./schemas/label.schema.json', 'utf8');
      let labelSchema = JSON.parse(labelSchemaString);
      for (var key in chan.direct) {
        if (key.startsWith("wire[")) {
          expect(JSON.parse(chan.direct[key])).to.be.jsonSchema(labelSchema);
        }
      }
    });
  }
});
